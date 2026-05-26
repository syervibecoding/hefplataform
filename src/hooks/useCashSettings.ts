import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CashSettings {
  id: string;
  saldo_inicial: number;
  data_saldo_inicial: string;
}

export function useCashSettings(enabled: boolean) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cash_settings"],
    enabled,
    queryFn: async (): Promise<CashSettings | null> => {
      const { data, error } = await supabase
        .from("cash_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        saldo_inicial: Number(data.saldo_inicial) || 0,
        data_saldo_inicial: data.data_saldo_inicial,
      };
    },
  });

  const save = useMutation({
    mutationFn: async (vals: { saldo_inicial: number; data_saldo_inicial: string }) => {
      const current = q.data;
      if (current) {
        const { error } = await supabase.from("cash_settings").update(vals).eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cash_settings").insert(vals);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash_settings"] });
      qc.invalidateQueries({ queryKey: ["cash-flow"] });
    },
  });

  return { settings: q.data || null, isLoading: q.isLoading, save };
}