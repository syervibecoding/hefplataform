import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TaxRateEntry {
  id: string;
  vigente_desde: string; // YYYY-MM-DD (dia 1)
  aliquota: number;
}

export function useTaxRateHistory(enabled: boolean) {
  return useQuery({
    queryKey: ["tax_rate_history"],
    enabled,
    queryFn: async (): Promise<TaxRateEntry[]> => {
      const { data, error } = await supabase
        .from("tax_rate_history")
        .select("id, vigente_desde, aliquota")
        .order("vigente_desde", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        vigente_desde: r.vigente_desde,
        aliquota: Number(r.aliquota),
      }));
    },
    staleTime: 60000,
  });
}

/**
 * Retorna a alíquota vigente no mês (year, month0-indexed).
 * Se não houver histórico, retorna fallback.
 */
export function rateForMonth(history: TaxRateEntry[], year: number, month: number, fallback = 6): number {
  if (!history || history.length === 0) return fallback;
  const mm = String(month + 1).padStart(2, "0");
  const target = `${year}-${mm}-01`;
  let current = fallback;
  for (const h of history) {
    if (h.vigente_desde <= target) current = h.aliquota;
    else break;
  }
  return current;
}