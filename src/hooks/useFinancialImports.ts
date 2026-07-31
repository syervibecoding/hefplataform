import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialImport {
  id: string;
  kind: "extrato" | "fatura";
  source_name: string;
  period_start: string | null;
  period_end: string | null;
  transactions_count: number;
  created_at: string;
}

export interface ParsedTransaction {
  data: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria_sugerida: string;
  investimento?: boolean;
}

export interface ConfirmedTransaction extends ParsedTransaction {
  include: boolean;
}

export function useFinancialImports(enabled: boolean) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["financial_imports"],
    enabled,
    queryFn: async (): Promise<FinancialImport[]> => {
      const { data, error } = await supabase
        .from("financial_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as FinancialImport[];
    },
  });

  const confirmImport = useMutation({
    mutationFn: async (payload: {
      kind: "extrato" | "fatura";
      sourceName: string;
      periodStart: string | null;
      periodEnd: string | null;
      transactions: Array<{
        data: string;
        nome: string;
        valor: number;
        tipo: "receita" | "despesa" | "investimento";
        categoria: string | null;
        origem_tipo?: "avulso" | "despesa";
        origem_id?: string | null;
        investment?: { investment_id: string; tipo: "aporte" | "resgate" | "rendimento" } | null;
      }>;
    }) => {
      const { data: imp, error: impErr } = await supabase
        .from("financial_imports")
        .insert({
          kind: payload.kind,
          source_name: payload.sourceName,
          period_start: payload.periodStart,
          period_end: payload.periodEnd,
          transactions_count: payload.transactions.length,
        })
        .select("id")
        .single();
      if (impErr) throw impErr;

      if (payload.transactions.length > 0) {
        const rows = payload.transactions.map((t) => ({
          tipo: t.tipo,
          origem_tipo: t.origem_tipo || "avulso",
          origem_id: t.origem_id ?? null,
          nome: t.nome,
          categoria: t.tipo === "receita" ? null : (t.categoria || "outros"),
          data: t.data,
          valor: t.valor,
          import_id: imp.id,
        }));
        const { error: insErr } = await supabase.from("cash_overrides").insert(rows as any);
        if (insErr) throw insErr;
      }

      const invRows = payload.transactions
        .filter((t) => t.investment?.investment_id)
        .map((t) => ({
          investment_id: t.investment!.investment_id,
          data: t.data,
          tipo: t.investment!.tipo,
          valor: t.valor,
          notas: `Importado de ${payload.sourceName}`,
          import_id: imp.id,
        }));
      if (invRows.length > 0) {
        const { error: invErr } = await supabase.from("investment_transactions").insert(invRows as any);
        if (invErr) throw invErr;
      }
      return imp.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_imports"] });
      qc.invalidateQueries({ queryKey: ["cash-flow"] });
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["investment_transactions"] });
    },
  });

  const revertImport = useMutation({
    mutationFn: async (importId: string) => {
      const { error: delInv } = await supabase
        .from("investment_transactions")
        .delete()
        .eq("import_id", importId);
      if (delInv) throw delInv;
      const { error: delOv } = await supabase
        .from("cash_overrides")
        .delete()
        .eq("import_id", importId);
      if (delOv) throw delOv;
      const { error: delImp } = await supabase
        .from("financial_imports")
        .delete()
        .eq("id", importId);
      if (delImp) throw delImp;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["financial_imports"] });
      qc.invalidateQueries({ queryKey: ["cash-flow"] });
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["investment_transactions"] });
    },
  });

  return { ...list, confirmImport, revertImport };
}