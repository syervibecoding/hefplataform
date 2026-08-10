import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, RotateCcw, Loader2, AlertCircle, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCashFlowYear } from "@/hooks/useCashFlow";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useRecentAssistantConversations,
  useSaveAssistantConversation,
} from "@/hooks/useAssistantConversations";

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const recent = useRecentAssistantConversations(3, isAdmin);
  const saveConv = useSaveAssistantConversation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => { taRef.current?.focus(); }, [streaming]);

  const contextPayload = useMemo(() => {
    const cfData = cf.data;
    // Lançamentos avulsos (entram via importação de extrato/fatura ou manualmente)
    // separados dos recorrentes, para permitir análise de "extras" mês a mês.
    const avulsos: Array<{ data: string; nome: string; categoria: string; valor: number; tipo: string }> = [];
    const avulsoPorMes: Array<{ month: number; despesasAvulsas: number; despesasRecorrentes: number; investimentosAvulsos: number; qtdAvulsas: number }> = [];
    if (cfData) {
      for (const m of cfData.months) {
        let despAvulsa = 0, despRec = 0, invAvulso = 0, qtd = 0;
        for (const e of m.entries) {
          const isAvulso = e.origemTipo === "avulso" || !!e.overrideId;
          if (e.tipo === "despesa") {
            if (isAvulso) { despAvulsa += e.valor; qtd++; } else { despRec += e.valor; }
          } else if (e.tipo === "investimento") {
            if (isAvulso) invAvulso += e.valor;
          }
          if (isAvulso && (e.tipo === "despesa" || e.tipo === "investimento")) {
            avulsos.push({ data: e.date, nome: e.nome, categoria: e.categoria || "outros", valor: e.valor, tipo: e.tipo });
          }
        }
        avulsoPorMes.push({ month: m.month, despesasAvulsas: despAvulsa, despesasRecorrentes: despRec, investimentosAvulsos: invAvulso, qtdAvulsas: qtd });
      }
    }
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
        avulsoPorMes,
        lancamentosAvulsos: avulsos.sort((a, b) => a.data.localeCompare(b.data)).slice(0, 400),
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
    setConversationId(null);
    setTimeout(() => taRef.current?.focus(), 0);
  };

  const loadConversation = (msgs: ChatMessage[], id: string) => {
    abortRef.current?.abort();
    setMessages(msgs);
    setError(null);
    setStreaming(false);
    setInput("");
    setConversationId(id);
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
      // Persiste a conversa após finalizar o stream
      setMessages((current) => {
        const finalMsgs = current.filter(
          (m) => !(m.role === "assistant" && m.content === ""),
        );
        const firstUser = finalMsgs.find((m) => m.role === "user");
        if (firstUser && finalMsgs.some((m) => m.role === "assistant" && m.content)) {
          const baseTitle = firstUser.content.trim().slice(0, 60);
          const title = firstUser.content.trim().length > 60 ? baseTitle + "…" : baseTitle;
          saveConv
            .mutateAsync({ id: conversationId, title, messages: finalMsgs })
            .then((id) => setConversationId(id))
            .catch(() => { /* silencioso */ });
        }
        return current;
      });
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
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" disabled={streaming}>
                <History size={14} className="mr-1" /> Histórico
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-2 bg-card border-border">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-1">
                Últimas 3 conversas (todos admins)
              </div>
              {recent.isLoading && (
                <div className="px-2 py-3 text-xs text-muted-foreground">Carregando…</div>
              )}
              {!recent.isLoading && (recent.data?.length ?? 0) === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground">Nenhuma conversa salva ainda.</div>
              )}
              <div className="flex flex-col">
                {recent.data?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadConversation(c.messages as ChatMessage[], c.id)}
                    className={`text-left px-2 py-2 rounded-md hover:bg-secondary/80 transition-colors ${
                      conversationId === c.id ? "bg-secondary/60" : ""
                    }`}
                  >
                    <div className="text-xs font-medium line-clamp-2">{c.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {c.author_username || "—"} · há {formatDistanceToNow(new Date(c.updated_at), { locale: ptBR })}
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="sm" onClick={newConversation} disabled={streaming}>
            <RotateCcw size={14} className="mr-1" /> Nova conversa
          </Button>
        </div>
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
          Enter envia · Shift+Enter quebra linha · Conversas ficam salvas e visíveis para admins
        </p>
      </div>
    </div>
  );
}