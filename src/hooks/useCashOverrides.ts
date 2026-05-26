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

  return { add, update, remove };
}