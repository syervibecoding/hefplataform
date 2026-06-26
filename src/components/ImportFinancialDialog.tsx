import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText, PdfPasswordRequiredError } from "@/lib/pdf-extract";
import { useFinancialImports, type ConfirmedTransaction } from "@/hooks/useFinancialImports";
import { EXPENSE_CATEGORIES, useCashExpenses, type CashExpense } from "@/hooks/useCashExpenses";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  detectDuplicates,
  findPeriodOverlap,
  type ExistingTx,
} from "@/lib/import-validation";
import type { FinancialImport } from "@/hooks/useFinancialImports";

function detectRecurringConflict(
  row: ConfirmedTransaction,
  expenses: CashExpense[],
): RecurringConflict | null {
  if (row.tipo !== "despesa") return null;
  const desc = (row.descricao || "").toUpperCase();
  if (!desc) return null;
  const rowMonth = (row.data || "").slice(0, 7);
  for (const e of expenses) {
    if (!e.ativo) continue;
    // só conflita se o mês da transação cai dentro da vigência
    const ds = e.data_inicio || "";
    const df = e.data_fim || null;
    if (ds && ds.slice(0, 7) > rowMonth) continue;
    if (df && df.slice(0, 7) < rowMonth) continue;
    const candidates = [e.nome, ...(e.aliases || [])].filter(Boolean).map((s) => s.toUpperCase());
    for (const term of candidates) {
      if (term.length < 3) continue;
      if (desc.includes(term) || term.includes(desc)) {
        return {
          expenseId: e.id,
          expenseName: e.nome,
          expenseValor: e.valor,
          matchedAlias: term,
        };
      }
    }
  }
  return null;
}

type Step = "upload" | "password" | "loading" | "review";

type RecurringAction = "substitute" | "ignore" | "keep_both";

interface RecurringConflict {
  expenseId: string;
  expenseName: string;
  expenseValor: number;
  matchedAlias: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ImportFinancialDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { confirmImport, data: allImports = [] } = useFinancialImports(true);
  const { expenses: recurringExpenses } = useCashExpenses(true);
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<"auto" | "extrato" | "fatura">("auto");
  const [detectedKind, setDetectedKind] = useState<"extrato" | "fatura">("extrato");
  const [origem, setOrigem] = useState("");
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [rows, setRows] = useState<ConfirmedTransaction[]>([]);
  const [duplicates, setDuplicates] = useState<Array<ExistingTx | null>>([]);
  const [overlapping, setOverlapping] = useState<FinancialImport[]>([]);
  const [conflicts, setConflicts] = useState<Array<RecurringConflict | null>>([]);
  const [actions, setActions] = useState<Array<RecurringAction | null>>([]);

  const reset = () => {
    setStep("upload"); setFile(null); setPassword(""); setPasswordError(null);
    setError(null); setHint("auto"); setRows([]); setOrigem("");
    setPeriodStart(null); setPeriodEnd(null);
    setDuplicates([]); setOverlapping([]); setConflicts([]); setActions([]);
  };

  const close = () => { reset(); onOpenChange(false); };

  const process = async (f: File, pwd?: string) => {
    setError(null);
    setStep("loading");
    let text: string;
    try {
      text = await extractPdfText(f, pwd);
    } catch (e) {
      if (e instanceof PdfPasswordRequiredError) {
        setPasswordError(e.incorrect ? "Senha incorreta. Tente de novo." : null);
        setStep("password");
        return;
      }
      setError((e as Error).message || "Falha ao ler PDF");
      setStep("upload");
      return;
    }

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("parse-financial-pdf", {
        body: { text, filename: f.name, hint: hint === "auto" ? undefined : hint },
      });
      if (fnErr) throw fnErr;
      if ((data as any)?.error) throw new Error((data as any).error);

      const parsed = data as {
        kind: "extrato" | "fatura";
        origem?: string;
        periodo_inicio?: string;
        periodo_fim?: string;
        transacoes: ConfirmedTransaction[];
      };

      setDetectedKind(parsed.kind || "extrato");
      setOrigem(parsed.origem || "");
      setPeriodStart(parsed.periodo_inicio || null);
      setPeriodEnd(parsed.periodo_fim || null);
      const parsedRows = (parsed.transacoes || []).map((t) => ({ ...t, include: true }));
      setRows(parsedRows);
      setStep("review");
      // run validations
      await runValidations(parsed.kind || "extrato", parsed.origem || "", parsed.periodo_inicio || null, parsed.periodo_fim || null, parsedRows);
    } catch (e: any) {
      setError(e?.message || "Falha ao processar PDF.");
      setStep("upload");
    }
  };

  const runValidations = async (
    kind: "extrato" | "fatura",
    origemDetected: string,
    pStart: string | null,
    pEnd: string | null,
    parsedRows: ConfirmedTransaction[],
  ) => {
    // period overlap
    setOverlapping(findPeriodOverlap(allImports, kind, origemDetected, pStart, pEnd));

    // recurring expense conflicts (by alias / nome)
    const recurringConflicts = parsedRows.map((row) => detectRecurringConflict(row, recurringExpenses));
    setConflicts(recurringConflicts);
    setActions(recurringConflicts.map((c) => (c ? null : null)));

    // duplicates vs existing cash_overrides
    if (pStart && pEnd && parsedRows.length > 0) {
      const { data, error } = await supabase
        .from("cash_overrides")
        .select("id,data,nome,tipo,valor,import_id")
        .gte("data", pStart)
        .lte("data", pEnd);
      if (!error && data) {
        const existing: ExistingTx[] = (data as any[]).map((r) => ({
          id: r.id, data: r.data, nome: r.nome, tipo: r.tipo,
          valor: Number(r.valor) || 0, import_id: r.import_id,
        }));
        const dups = detectDuplicates(parsedRows, existing);
        setDuplicates(dups);
        // auto-uncheck duplicates
        if (dups.some(Boolean)) {
          setRows((rs) => rs.map((r, i) => dups[i] ? { ...r, include: false } : r));
        }
      }
    } else {
      setDuplicates(new Array(parsedRows.length).fill(null));
    }
  };

  const onFileChange = (f: File | null) => {
    setFile(f);
    setPassword("");
    setPasswordError(null);
    if (f) process(f);
  };

  const onPasswordSubmit = () => {
    if (!file) return;
    process(file, password);
  };

  const updateRow = (i: number, patch: Partial<ConfirmedTransaction>) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };

  const setRowAction = (i: number, action: RecurringAction) => {
    setActions((arr) => arr.map((a, idx) => (idx === i ? action : a)));
    // se a ação é "ignore" desmarca; se outra ação, garante marcado
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, include: action !== "ignore" } : r)));
  };

  const toggleAll = (v: boolean) => setRows((r) => r.map((row) => ({ ...row, include: v })));

  const uncheckDuplicates = () => {
    setRows((rs) => rs.map((r, i) => duplicates[i] ? { ...r, include: false } : r));
  };

  const confirm = async () => {
    const included = rows.filter((r) => r.include);
    if (included.length === 0) {
      toast({ title: "Nada selecionado", description: "Marque ao menos uma transação." });
      return;
    }
    // bloqueia se houver conflito com recorrente sem ação escolhida
    const unresolved = rows
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => r.include && conflicts[i] && !actions[i]);
    if (unresolved.length > 0) {
      toast({
        title: "Resolva os conflitos antes",
        description: `${unresolved.length} transação(ões) batem com despesas recorrentes. Escolha "Substituir", "Ignorar" ou "Manter ambos" em cada uma.`,
        variant: "destructive",
      });
      return;
    }
    try {
      await confirmImport.mutateAsync({
        kind: detectedKind,
        sourceName: origem ? `${origem} — ${file?.name || ""}`.trim() : (file?.name || "Importação"),
        periodStart, periodEnd,
        transactions: rows
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => t.include)
          .map(({ t, i }) => {
            const conflict = conflicts[i];
            const action = actions[i];
            const substitute = conflict && action === "substitute";
            return {
              data: t.data,
              nome: t.descricao,
              valor: t.valor,
              tipo: t.tipo,
              categoria: t.categoria_sugerida,
              origem_tipo: substitute ? ("despesa" as const) : ("avulso" as const),
              origem_id: substitute ? conflict!.expenseId : null,
            };
          }),
      });
      toast({ title: "Importação concluída", description: `${included.length} lançamento(s) adicionado(s) ao fluxo de caixa.` });
      close();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const totalIn = rows.filter((r) => r.include && r.tipo === "receita").reduce((a, b) => a + b.valor, 0);
  const totalOut = rows.filter((r) => r.include && r.tipo === "despesa").reduce((a, b) => a + b.valor, 0);
  const saldo = totalIn - totalOut;
  const dupCount = duplicates.filter(Boolean).length;
  const dupSelected = rows.filter((r, i) => r.include && duplicates[i]).length;
  const conflictCount = conflicts.filter(Boolean).length;
  const conflictUnresolved = rows.filter((r, i) => r.include && conflicts[i] && !actions[i]).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(true); }}>
      <DialogContent className="bg-card border-border sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-heading">Importar extrato ou fatura</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] text-muted-foreground">Tipo do documento</Label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {(["auto", "extrato", "fatura"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setHint(k)}
                    className={`px-2 py-1.5 rounded-md text-[11px] font-semibold border transition-all ${
                      hint === k ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                    }`}>
                    {k === "auto" ? "Detectar" : k === "extrato" ? "Extrato bancário" : "Fatura de cartão"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:bg-secondary/40 transition-all">
              <Upload size={24} className="text-muted-foreground" />
              <span className="text-sm font-medium">Clique para selecionar um PDF</span>
              <span className="text-[11px] text-muted-foreground">Extrato bancário ou fatura de cartão (PDFs com senha são aceitos)</span>
              <input type="file" accept="application/pdf" className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
            </label>
            {error && (
              <div className="flex items-start gap-2 text-xs text-hef-danger bg-hef-danger/10 border border-hef-danger/30 rounded-md p-2">
                <AlertCircle size={14} className="mt-0.5" /><span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "password" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Este PDF está protegido. Informe a senha para abrir <strong>{file?.name}</strong>.
            </p>
            <Input type="password" value={password} autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onPasswordSubmit()}
              placeholder="Senha do PDF" className="h-9 bg-secondary border-border text-xs" />
            {passwordError && <p className="text-[11px] text-hef-danger">{passwordError}</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={close}>Cancelar</Button>
              <Button onClick={onPasswordSubmit} disabled={!password}>Abrir</Button>
            </DialogFooter>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Lendo PDF e classificando transações com OpenAI…</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-3">
            {overlapping.length > 0 && (
              <div className="flex items-start gap-2 text-[11px] bg-yellow-500/10 border border-yellow-500/30 rounded-md p-2 text-yellow-200">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Atenção:</strong> já existe importação com período sobreposto.{" "}
                  {overlapping.slice(0, 3).map((o, i) => (
                    <span key={o.id}>
                      {i > 0 ? "; " : ""}
                      {o.source_name} ({o.period_start || "?"} → {o.period_end || "?"}, em {new Date(o.created_at).toLocaleDateString("pt-BR")})
                    </span>
                  ))}
                  . Confira para evitar duplicidade.
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-secondary border border-border">
                {detectedKind === "fatura" ? "Fatura de cartão" : "Extrato bancário"}
              </span>
              {origem && <span className="text-muted-foreground">Origem: <strong>{origem}</strong></span>}
              {(periodStart || periodEnd) && (
                <span className="text-muted-foreground">Período: {periodStart || "?"} → {periodEnd || "?"}</span>
              )}
              <span className="ml-auto flex items-center gap-3">
                <span className="text-muted-foreground">
                  <span className="text-hef-success font-semibold">+{totalIn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>{" "}
                  <span className="text-hef-danger font-semibold">-{totalOut.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </span>
                <span className="px-2 py-1 rounded-md bg-secondary border border-border font-mono">
                  Saldo:{" "}
                  <span className={saldo >= 0 ? "text-hef-success font-semibold" : "text-hef-danger font-semibold"}>
                    {saldo >= 0 ? "+" : ""}{saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => toggleAll(true)}>Marcar todos</Button>
                <Button size="sm" variant="ghost" onClick={() => toggleAll(false)}>Desmarcar todos</Button>
                {dupCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={uncheckDuplicates} className="text-yellow-300 hover:text-yellow-200">
                    Desmarcar duplicatas
                  </Button>
                )}
              </div>
              <span className="text-muted-foreground">
                {rows.filter((r) => r.include).length} de {rows.length} selecionadas
                {dupCount > 0 && (
                  <> · <span className="text-yellow-300">{dupCount} duplicata(s)</span>
                  {dupSelected > 0 && <span className="text-yellow-300"> ({dupSelected} marcada(s))</span>}</>
                )}
              </span>
            </div>

            <div className="border border-border rounded-lg overflow-auto max-h-[55vh]">
              <table className="w-full text-xs">
                <thead className="bg-secondary/60 text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 w-8"></th>
                    <th className="px-2 py-1.5 text-left font-semibold">Data</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Descrição</th>
                    <th className="px-2 py-1.5 text-left font-semibold w-20">Status</th>
                    <th className="px-2 py-1.5 text-left font-semibold w-24">Tipo</th>
                    <th className="px-2 py-1.5 text-left font-semibold w-36">Categoria</th>
                    <th className="px-2 py-1.5 text-right font-semibold w-28">Valor (R$)</th>
                    <th className="px-2 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className={`border-t border-border/50 ${r.include ? "" : "opacity-40"}`}>
                      <td className="px-2 py-1 text-center">
                        <input type="checkbox" checked={r.include}
                          onChange={(e) => updateRow(i, { include: e.target.checked })} />
                      </td>
                      <td className="px-2 py-1">
                        <Input type="date" value={r.data} onChange={(e) => updateRow(i, { data: e.target.value })}
                          className="h-7 bg-secondary border-border text-xs" />
                      </td>
                      <td className="px-2 py-1">
                        <Input value={r.descricao} onChange={(e) => updateRow(i, { descricao: e.target.value })}
                          className="h-7 bg-secondary border-border text-xs" />
                      </td>
                      <td className="px-2 py-1">
                        {duplicates[i] ? (
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 cursor-help">
                                  <AlertTriangle size={10} /> Duplicata
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[11px] max-w-xs">
                                Já existe: {duplicates[i]!.data} · {duplicates[i]!.nome} ·{" "}
                                R$ {duplicates[i]!.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <select value={r.tipo}
                          onChange={(e) => updateRow(i, { tipo: e.target.value as "receita" | "despesa" })}
                          className="h-7 w-full rounded-md border border-border bg-secondary px-1 text-xs">
                          <option value="receita">Receita</option>
                          <option value="despesa">Despesa</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select value={r.categoria_sugerida}
                          onChange={(e) => updateRow(i, { categoria_sugerida: e.target.value })}
                          className="h-7 w-full rounded-md border border-border bg-secondary px-1 text-xs">
                          {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <Input type="number" step={0.01} value={r.valor}
                          onChange={(e) => updateRow(i, { valor: Number(e.target.value) })}
                          className="h-7 bg-secondary border-border text-xs text-right font-mono" />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                          className="text-muted-foreground hover:text-hef-danger">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={close}>Cancelar</Button>
              <Button onClick={confirm} disabled={confirmImport.isPending}>
                {confirmImport.isPending ? "Salvando…" : `Adicionar ao fluxo de caixa`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}