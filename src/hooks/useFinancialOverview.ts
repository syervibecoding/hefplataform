import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductFinancial {
  productId: string;
  clientCount: number;
  totalRevenue: number;
}

export function useFinancialOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["financial-overview"],
    enabled,
    queryFn: async (): Promise<ProductFinancial[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("product_id, status, faturamento, valor_contrato")
        .eq("status", "ativo");
      if (error) throw error;

      const grouped = new Map<string, { count: number; revenue: number }>();

      for (const row of data || []) {
        const pid = row.product_id;
        const current = grouped.get(pid) || { count: 0, revenue: 0 };
        current.count++;
        // HefSys uses faturamento, others use valor_contrato
        const revenue = pid === "hefsys"
          ? (row.faturamento || 0)
          : (row.valor_contrato || 0);
        current.revenue += Number(revenue);
        grouped.set(pid, current);
      }

      return Array.from(grouped.entries()).map(([productId, v]) => ({
        productId,
        clientCount: v.count,
        totalRevenue: v.revenue,
      }));
    },
    staleTime: 60000,
  });
}
