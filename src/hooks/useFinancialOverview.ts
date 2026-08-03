import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getValorEfetivo } from "@/lib/getValorEfetivo";

export interface ProductFinancial {
  productId: string;
  clientCount: number;
  totalRevenue: number;
}

export function useFinancialOverview(enabled: boolean, year?: number, month?: number) {
  const ref = new Date();
  const y = year ?? ref.getFullYear();
  const m = month ?? ref.getMonth();
  return useQuery({
    queryKey: ["financial-overview", y, m],
    enabled,
    queryFn: async (): Promise<ProductFinancial[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, product_id, status, faturamento, valor_contrato, valor_implementacao, valor_mensalidade, tem_mensalidade, data_implementacao, data_inicio")
        .eq("status", "ativo");
      if (error) throw error;

      const clientIds = (data || []).map((r: any) => r.id);
      let adjustmentsByClient = new Map<string, { data_inicio: string; novo_valor: number }[]>();
      if (clientIds.length > 0) {
        const { data: adjs } = await supabase
          .from("client_value_adjustments")
          .select("client_id, data_inicio, novo_valor")
          .in("client_id", clientIds);
        for (const a of adjs || []) {
          const arr = adjustmentsByClient.get((a as any).client_id) || [];
          arr.push({ data_inicio: (a as any).data_inicio, novo_valor: Number((a as any).novo_valor) });
          adjustmentsByClient.set((a as any).client_id, arr);
        }
      }

      const grouped = new Map<string, { count: number; revenue: number }>();

      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0);

      for (const row of data || []) {
        const pid = row.product_id;
        // Recorte temporal: cliente só conta a partir do início do contrato.
        if (pid !== "plataformas" && (row as any).data_inicio) {
          const di = new Date((row as any).data_inicio + "T00:00:00");
          if (di > monthEnd) continue;
        }
        const current = grouped.get(pid) || { count: 0, revenue: 0 };
        let revenue = 0;
        const adjs = adjustmentsByClient.get((row as any).id);
        if (pid === "hefsys") {
          current.count++;
          revenue = getValorEfetivo(Number(row.faturamento || 0), adjs, y, m);
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
          revenue = getValorEfetivo(Number(row.valor_contrato || 0), adjs, y, m);
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
