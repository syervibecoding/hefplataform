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
        .select("product_id, status, faturamento, valor_contrato, valor_implementacao, valor_mensalidade, tem_mensalidade, data_implementacao")
        .eq("status", "ativo");
      if (error) throw error;

      const grouped = new Map<string, { count: number; revenue: number }>();

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      for (const row of data || []) {
        const pid = row.product_id;
        const current = grouped.get(pid) || { count: 0, revenue: 0 };
        let revenue = 0;
        if (pid === "hefsys") {
          current.count++;
          revenue = Number(row.faturamento || 0);
        } else if (pid === "plataformas") {
          const dataImpl = row.data_implementacao ? new Date(row.data_implementacao + "T00:00:00") : null;
          // Plataformas são projetos pontuais: só contam como "ativos" no mês
          // em que a implementação ocorre OU se tiverem mensalidade recorrente.
          if (dataImpl && dataImpl >= monthStart && dataImpl <= monthEnd) {
            revenue += Number(row.valor_implementacao || 0);
            current.count++;
          } else if (row.tem_mensalidade && dataImpl && dataImpl <= monthEnd) {
            current.count++;
          }
          // Mensalidade conta se ativada e implementação já ocorreu
          if (row.tem_mensalidade && dataImpl && dataImpl <= monthEnd) {
            revenue += Number(row.valor_mensalidade || 0);
          }
        } else {
          current.count++;
          revenue = Number(row.valor_contrato || 0);
        }
        current.revenue += revenue;
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
