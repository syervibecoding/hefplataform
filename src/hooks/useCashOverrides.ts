import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OverrideTipo = "receita" | "despesa" | "investimento" | "aporte" | "retirada";

export interface CashOverrideInput {
  tipo: OverrideTipo;
  origem_tipo?: "cliente" | "despesa" | "avulso";
  origem_id?: string | null;
  nome: string;
  categoria?: string | null;
  data: string;
  valor: number;
}

export function useCashOverrides() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["cash-flow"] });

  const add = useMutation({
    mutationFn: async (o: CashOverrideInput) => {
      const { error } = await supabase.from("cash_overrides").insert({
        tipo: o.tipo,
        origem_tipo: o.origem_tipo || "avulso",
        origem_id: o.origem_id || null,
        nome: o.nome,
        categoria: o.categoria || null,
        data: o.data,
        valor: o.valor,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CashOverrideInput> }) => {
      const { error } = await supabase.from("cash_overrides").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_overrides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const upsertCell = useMutation({
    mutationFn: async (args: {
      tipo: OverrideTipo;
      rowOrigemTipo: "cliente" | "despesa" | "avulso";
      rowOrigemId: string | null;
      monthOverrideId: string | null;
      nome: string;
      categoria: string | null;
      year: number;
      month: number; // 0-11
      day: number;
      valor: number;
    }) => {
      const {
        tipo,
        rowOrigemTipo,
        rowOrigemId,
        monthOverrideId,
        nome,
        categoria,
        year,
        month,
        day,
        valor,
      } = args;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const d = Math.min(Math.max(1, day || 5), lastDay);
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const data = `${year}-${mm}-${dd}`;

      if (monthOverrideId) {
        const { error } = await supabase
          .from("cash_overrides")
          .update({ valor, data, nome, categoria, tipo })
          .eq("id", monthOverrideId);
        if (error) throw error;
        return;
      }

      if (rowOrigemTipo !== "avulso" && rowOrigemId) {
        const monthStart = `${year}-${mm}-01`;
        const monthEnd = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;
        const { data: existing, error: selErr } = await supabase
          .from("cash_overrides")
          .select("id")
          .eq("origem_tipo", rowOrigemTipo)
          .eq("origem_id", rowOrigemId)
          .gte("data", monthStart)
          .lte("data", monthEnd)
          .maybeSingle();
        if (selErr) throw selErr;
        if (existing) {
          const { error } = await supabase
            .from("cash_overrides")
            .update({ valor, data, nome, categoria, tipo })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("cash_overrides").insert({
            tipo,
            origem_tipo: rowOrigemTipo,
            origem_id: rowOrigemId,
            nome,
            categoria,
            data,
            valor,
          });
          if (error) throw error;
        }
        return;
      }

      const { error } = await supabase.from("cash_overrides").insert({
        tipo,
        origem_tipo: "avulso",
        origem_id: null,
        nome,
        categoria,
        data,
        valor,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, update, remove, upsertCell };
}