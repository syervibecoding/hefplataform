import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCashFlowYear } from "@/hooks/useCashFlow";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatRole = "user" | "assistant";
interface ChatMessage { role: ChatRole; content: string }

const SUGGESTIONS = [
  "Qual minha projeção de saldo até dezembro mantendo o ritmo atual?",
  "Em qual mês meu caixa fica mais apertado este ano?",
  "Qual produto traz a melhor relação receita por cliente?",
  "Onde estou gastando mais e o que posso cortar?",
];

function useMrrSnapshot(products: { id: string; nome: string }[], enabled: boolean) {
  return useQuery({
    queryKey: ["assistant-mrr"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("product_id, status, faturamento, valor_contrato, valor_mensalidade, tem_mensalidade, data_implementacao")
        .eq("status", "ativo");
      if (error) throw error;
      const rows = data || [];
      const byPid: Record<string, { clientes: number; receitaMensal: number }> = {};
      const today = new Date();
      for (const c of rows) {
        const pid = c.product_id as string;
        if (!byPid[pid]) byPid[pid] = { clientes: 0, receitaMensal: 0 };
        byPid[pid].clientes += 1;
        if (pid === "hefsys") {
          byPid[pid].receitaMensal += Number(c.faturamento || 0);
        } else if (pid === "consultoria-clix") {
          byPid[pid].receitaMensal += Number(c.valor_contrato || 0);
        } else if (pid === "plataformas") {
          if (c.tem_mensalidade) {
            const di = c.data_implementacao ? new Date(c.data_implementacao + "T00:00:00") : null;
            if (!di || di <= today) byPid[pid].receitaMensal += Number(c.valor_mensalidade || 0);
          }
        }
      }
      const byProduct = Object.entries(byPid).map(([pid, v]) => ({
        productId: pid,
        nome: products.find((p) => p.id === pid)?.nome || pid,
        clientes: v.clientes,
        receitaMensal: v.receitaMensal,
      }));
      return {
        totalClientes: rows.length,
        mrrTotal: byProduct.reduce((s, p) => s + p.receitaMensal, 0),
        byProduct,
      };
    },
    staleTime: 30000,
  });
}

export default function AssistantPage() {
  const { isAdmin } = useAuth();
  const year = new Date().getFullYear();
  const cf = useCashFlowYear(year, isAdmin);
  const { products } = useProducts();
  const mrr = useMrrSnapshot(products, isAdmin);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => { taRef.current?.focus(); }, [streaming]);

  const contextPayload = useMemo(() => {
    const cfData = cf.data;
    return {
      cashFlow: cfData ? {
        year: cfData.year,
        saldoInicial: cfData.saldoInicial,
        totalReceitas: cfData.totalReceitas,
        totalDespesas: cfData.totalDespesas,
        totalInvestimentos: cfData.totalInvestimentos,
        totalAportes: cfData.totalAportes,
        totalRetiradas: cfData.totalRetiradas,
        totalResultado: cfData.totalResultado,
        months: cfData.months.map((m) => ({
          month: m.month,
          receitas: m.receitas,
          despesas: m.despesas,
          investimentos: m.investimentos,
          aportes: m.aportes,
          retiradas: m.retiradas,
          resultado: m.resultado,
          saldoFinal: m.saldoFinal,
          byCategoryDespesa: m.byCategoryDespesa,
          byCategoryReceita: m.byCategoryReceita,
        })),
      } : null,
      mrr: mrr.data || null,
    };
  }, [cf.data, mrr.data]);

  const newConversation = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
    setInput("");
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-assistant-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          messages: next.filter((m, i) => !(i === next.length - 1 && m.role === "assistant")).map((m) => ({ role: m.role, content: m.content })),
          context: contextPayload,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const txt = await res.text();
        let msg = "Falha ao consultar o assistente.";
        try { msg = JSON.parse(txt)?.error || msg; } catch { /* */ }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            if (j.error) throw new Error(j.error);
            if (j.delta) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (!last || last.role !== "assistant") return prev;
                const updated = [...prev];
                updated[updated.length - 1] = { ...last, content: last.content + j.delta };
                return updated;
              });
            }
          } catch (e: any) {
            throw e;
          }
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setError(e?.message || "Erro ao consultar o assistente.");
      setMessages((prev) => {
        // Remove placeholder assistant vazio se nada streamou
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const loadingContext = cf.isLoading || mrr.isLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold font-heading">Assistente Financeiro</div>
            <div className="text-[10px] text-muted-foreground">
              {loadingContext ? "Carregando contexto…" : `Fluxo de caixa ${year} + ${mrr.data?.totalClientes ?? 0} clientes ativos`}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={newConversation} disabled={streaming}>
          <RotateCcw size={14} className="mr-1" /> Nova conversa
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto py-8 space-y-4">
            <h2 className="text-lg font-semibold font-heading">Como posso ajudar hoje?</h2>
            <p className="text-xs text-muted-foreground">
              Pergunte sobre projeções, riscos de caixa, performance por produto ou qualquer dúvida sobre os números reais do negócio.
              Eu uso seu fluxo de caixa de {year} e a base de clientes ativos como contexto.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)} disabled={streaming}
                  className="text-left text-xs p-3 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/80 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-secondary/60 border border-border rounded-bl-sm"
            }`}>
              {m.role === "assistant" ? (
                m.content ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:font-heading prose-headings:mt-3 prose-headings:mb-1 prose-table:text-xs prose-th:px-2 prose-td:px-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                )
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}

        {error && (
          <div className="flex items-start gap-2 text-xs text-hef-danger bg-hef-danger/10 border border-hef-danger/30 rounded-md p-2 max-w-2xl mx-auto">
            <AlertCircle size={14} className="mt-0.5" /><span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 bg-secondary/30">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={loadingContext ? "Carregando seus dados financeiros…" : "Pergunte sobre seu caixa, projeções, clientes…"}
            disabled={loadingContext || streaming}
            rows={1}
            className="flex-1 min-h-[40px] max-h-32 bg-card border-border text-sm resize-none"
          />
          <Button onClick={send} disabled={!input.trim() || streaming || loadingContext} size="icon">
            {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Enter envia · Shift+Enter quebra linha · As conversas não são salvas
        </p>
      </div>
    </div>
  );
}