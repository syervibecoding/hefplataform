import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AllClientRow {
  id: string;
  nome: string;
  contato: string;
  email: string;
  status: string;
  product_id: string;
  faturamento: number;
  valor_contrato: number;
  valor_implementacao: number;
  valor_mensalidade: number;
  tem_mensalidade: boolean;
  data_implementacao: string | null;
}

export function useAllClients(enabled: boolean) {
  return useQuery({
    queryKey: ["all-clients"],
    enabled,
    queryFn: async (): Promise<AllClientRow[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nome, contato, email, status, product_id, faturamento, valor_contrato, valor_implementacao, valor_mensalidade, tem_mensalidade, data_implementacao")
        .order("nome");
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        contato: r.contato,
        email: r.email,
        status: r.status,
        product_id: r.product_id,
        faturamento: Number(r.faturamento) || 0,
        valor_contrato: Number(r.valor_contrato) || 0,
        valor_implementacao: Number(r.valor_implementacao) || 0,
        valor_mensalidade: Number(r.valor_mensalidade) || 0,
        tem_mensalidade: !!r.tem_mensalidade,
        data_implementacao: r.data_implementacao || null,
      }));
    },
    staleTime: 30000,
  });
}

export function clientMonthlyRevenue(c: AllClientRow, now = new Date()): number {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  if (c.product_id === "hefsys") return c.faturamento;
  if (c.product_id === "plataformas") {
    let v = 0;
    const di = c.data_implementacao ? new Date(c.data_implementacao + "T00:00:00") : null;
    if (di && di >= monthStart && di <= monthEnd) v += c.valor_implementacao;
    if (c.tem_mensalidade && di && di <= monthEnd) v += c.valor_mensalidade;
    return v;
  }
  return c.valor_contrato;
}