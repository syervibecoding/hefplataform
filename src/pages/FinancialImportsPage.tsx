import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialImports, type FinancialImport } from "@/hooks/useFinancialImports";
import ImportFinancialDialog from "@/components/ImportFinancialDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Eye, Download, RotateCcw, Loader2 } from "lucide-react";
import { categoryLabel } from "@/hooks/useCashExpenses";
import { exportImportToCsv } from "@/lib/import-validation";
import { useToast } from "@/hooks/use-toast";

interface ImportRow {
  id: string;
  data: string;
  nome: string;
  tipo: string;
  categoria: string | null;
  valor: number;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  const [y, m, d] = s.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

export default function FinancialImportsPage() {
  const { toast } = useToast();
  const { data: imports = [], isLoading, revertImport } = useFinancialImports(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<FinancialImport | null>(null);
  const [revertFor, setRevertFor] = useState<FinancialImport | null>(null);

  const importIds = imports.map((i) => i.id);
  const { data: totalsMap = {} } = useQuery({
    queryKey: ["financial_imports_totals", importIds.join(",")],
    enabled: importIds.length > 0,
    queryFn: async (): Promise<Record<string, { receita: number; despesa: number }>> => {
      const { data, error } = await supabase
        .from("cash_overrides")
        .select("import_id,tipo,valor")
        .in("import_id", importIds);
      if (error) throw error;
      const out: Record<string, { receita: number; despesa: number }> = {};
      for (const r of (data || []) as any[]) {
        const k = r.import_id as string;
        if (!out[k]) out[k] = { receita: 0, despesa: 0 };
        const v = Number(r.valor) || 0;
        if (r.tipo === "receita") out[k].receita += v;
        else if (r.tipo === "despesa") out[k].despesa += v;
      }
      return out;
    },
  });

  const detailRows = useQuery({
    queryKey: ["financial_import_rows", detailFor?.id],
    enabled: !!detailFor,
    queryFn: async (): Promise<ImportRow[]> => {
      const { data, error } = await supabase
        .from("cash_overrides")
        .select("id,data,nome,tipo,categoria,valor")
        .eq("import_id", detailFor!.id)
        .order("data", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id, data: r.data, nome: r.nome,
        tipo: r.tipo, categoria: r.categoria,
        valor: Number(r.valor) || 0,
      }));
    },
  });

  const handleExport = async (imp: FinancialImport) => {
    const { data, error } = await supabase
      .from("cash_overrides")
      .select("data,nome,tipo,categoria,valor")
      .eq("import_id", imp.id)
      .order("data", { ascending: true });
    if (error) {
      toast({ title: "Erro ao exportar", description: error.message, variant: "destructive" });
      return;
    }
    exportImportToCsv(imp, (data || []).map((r: any) => ({
      data: r.data, nome: r.nome, tipo: r.tipo, categoria: r.categoria, valor: Number(r.valor) || 0,
    })));
  };

  const handleRevert = async () => {
    if (!revertFor) return;
    try {
      await revertImport.mutateAsync(revertFor.id);
      toast({ title: "Importação revertida", description: "Todos os lançamentos foram removidos." });
      setRevertFor(null);
    } catch (e: any) {
      toast({ title: "Erro ao reverter", description: e?.message || "Tente novamente.", variant: "destructive" });
    }
  };

  const totalImports = imports.length;
  const totalTx = useMemo(() => imports.reduce((a, b) => a + (b.transactions_count || 0), 0), [imports]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-heading">Importações financeiras</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalImports} importação(ões) · {totalTx} transações totais
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Upload size={14} /> Nova importação
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-muted-foreground text-xs gap-2">
            <Loader2 size={14} className="animate-spin" /> Carregando…
          </div>
        ) : imports.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground">
            Nenhuma importação ainda. Clique em <strong>Nova importação</strong> para começar.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Importado em</th>
                  <th className="px-3 py-2 text-left font-semibold">Origem</th>
                  <th className="px-3 py-2 text-left font-semibold">Tipo</th>
                  <th className="px-3 py-2 text-left font-semibold">Período</th>
                  <th className="px-3 py-2 text-right font-semibold">Transações</th>
                  <th className="px-3 py-2 text-right font-semibold">Totais</th>
                  <th className="px-3 py-2 text-right font-semibold w-44">Ações</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => {
                  const t = totalsMap[imp.id] || { receita: 0, despesa: 0 };
                  return (
                    <tr key={imp.id} className="border-t border-border/60 hover:bg-secondary/30">
                      <td className="px-3 py-2 whitespace-nowrap">
                        {new Date(imp.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-3 py-2 max-w-[280px] truncate" title={imp.source_name}>
                        {imp.source_name}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-md bg-secondary border border-border text-[10px]">
                          {imp.kind === "fatura" ? "Fatura" : "Extrato"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                        {fmtDate(imp.period_start)} → {fmtDate(imp.period_end)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{imp.transactions_count}</td>
                      <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                        <span className="text-hef-success">+{fmtBRL(t.receita)}</span>{" "}
                        <span className="text-hef-danger">-{fmtBRL(t.despesa)}</span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={() => setDetailFor(imp)}>
                            <Eye size={12} /> Ver
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1" onClick={() => handleExport(imp)}>
                            <Download size={12} /> CSV
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-hef-danger hover:text-hef-danger" onClick={() => setRevertFor(imp)}>
                            <RotateCcw size={12} /> Reverter
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ImportFinancialDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <Dialog open={!!detailFor} onOpenChange={(v) => !v && setDetailFor(null)}>
        <DialogContent className="bg-card border-border sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Transações — {detailFor?.source_name}
            </DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-lg overflow-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="bg-secondary/60 text-muted-foreground sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold w-24">Data</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Descrição</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-24">Tipo</th>
                  <th className="px-2 py-1.5 text-left font-semibold w-36">Categoria</th>
                  <th className="px-2 py-1.5 text-right font-semibold w-28">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {(detailRows.data || []).map((r) => (
                  <tr key={r.id} className="border-t border-border/50">
                    <td className="px-2 py-1 whitespace-nowrap">{fmtDate(r.data)}</td>
                    <td className="px-2 py-1">{r.nome}</td>
                    <td className="px-2 py-1">
                      <span className={r.tipo === "receita" ? "text-hef-success" : "text-hef-danger"}>
                        {r.tipo}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-muted-foreground">{r.categoria ? categoryLabel(r.categoria) : "—"}</td>
                    <td className="px-2 py-1 text-right font-mono">{fmtBRL(r.valor)}</td>
                  </tr>
                ))}
                {detailRows.isLoading && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Carregando…</td></tr>
                )}
                {!detailRows.isLoading && (detailRows.data || []).length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Sem transações.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revertFor} onOpenChange={(v) => !v && setRevertFor(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter importação?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os {revertFor?.transactions_count || 0} lançamentos desta importação serão removidos do fluxo de caixa. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} className="bg-hef-danger hover:bg-hef-danger/90">
              Reverter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}