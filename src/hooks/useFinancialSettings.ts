import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFinancialSettings(enabled: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["financial_settings"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => { map[r.key] = Number(r.value); });
      return map;
    },
    staleTime: 60000,
  });

  const setValue = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const { error } = await supabase
        .from("financial_settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial_settings"] }),
  });

  const taxRate = query.data?.tax_rate ?? 6;
  return { settings: query.data || {}, taxRate, isLoading: query.isLoading, setValue };
}
