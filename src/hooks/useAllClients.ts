import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getValorEfetivo, type ValueAdjustment } from "@/lib/getValorEfetivo";

export interface ClientRow {
  id: string;
  nome: string;
  contato: string;
  whatsapp: string;
  email: string;
  status: string;
  product_id: string;
  valor_contrato: number | null;
  faturamento: number | null;
  nivel_dificuldade: string | null;
  data_golive: string | null;
  data_kickoff: string | null;
  created_at: string;
  valor_implementacao: number;
  valor_mensalidade: number;
  tem_mensalidade: boolean;
  data_implementacao: string | null;
}

export type AllClientRow = ClientRow;

export type HealthStatus = "saudavel" | "atencao" | "critico";

export function calculateHealthScore(client: ClientRow): { status: HealthStatus; label: string; color: string } {
  let score = 100;
  if (client.status !== "ativo") score -= 50;
  if (client.nivel_dificuldade === "dificil") score -= 30;
  else if (client.nivel_dificuldade === "medio") score -= 10;
  if (!client.whatsapp && !client.email) score -= 15;
  if (!client.valor_contrato && !client.faturamento) score -= 5;

  if (score >= 70) {
    return { status: "saudavel", label: "Saudável", color: "bg-green-500/15 text-green-600 border-green-500/20" };
  } else if (score >= 40) {
    return { status: "atencao", label: "Atenção", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" };
  }
  return { status: "critico", label: "Crítico", color: "bg-red-500/15 text-red-600 border-red-500/20" };
}

export function useAllClients(productFilter?: string | null | boolean) {
  // Backward compatible: pass a string product id to filter, null/undefined for all.
  // Passing a boolean is accepted as an "enabled" flag (legacy callers).
  const filter = typeof productFilter === "string" ? productFilter : null;
  const enabled = typeof productFilter === "boolean" ? productFilter : true;
  return useQuery({
    queryKey: ["all_clients", filter],
    enabled,
    queryFn: async (): Promise<ClientRow[]> => {
      let query = supabase
        .from("clients")
        .select("id, nome, contato, whatsapp, email, status, product_id, valor_contrato, faturamento, nivel_dificuldade, data_golive, data_kickoff, created_at, valor_implementacao, valor_mensalidade, tem_mensalidade, data_implementacao")
        .order("nome");
      if (filter) query = query.eq("product_id", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        contato: r.contato,
        whatsapp: r.whatsapp || "",
        email: r.email,
        status: r.status,
        product_id: r.product_id,
        valor_contrato: r.valor_contrato == null ? null : Number(r.valor_contrato),
        faturamento: r.faturamento == null ? null : Number(r.faturamento),
        nivel_dificuldade: r.nivel_dificuldade || null,
        data_golive: r.data_golive || null,
        data_kickoff: r.data_kickoff || null,
        created_at: r.created_at,
        valor_implementacao: Number(r.valor_implementacao) || 0,
        valor_mensalidade: Number(r.valor_mensalidade) || 0,
        tem_mensalidade: !!r.tem_mensalidade,
        data_implementacao: r.data_implementacao || null,
      }));
    },
    staleTime: 30000,
  });
}

export function clientMonthlyRevenue(
  c: ClientRow,
  now = new Date(),
  adjustments?: ValueAdjustment[],
): number {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const y = now.getFullYear();
  const m = now.getMonth();
  if (c.product_id === "hefsys") return getValorEfetivo(c.faturamento || 0, adjustments, y, m);
  if (c.product_id === "plataformas") {
    let v = 0;
    const di = c.data_implementacao ? new Date(c.data_implementacao + "T00:00:00") : null;
    if (di && di >= monthStart && di <= monthEnd) v += c.valor_implementacao;
    if (c.tem_mensalidade && di && di <= monthEnd) v += c.valor_mensalidade;
    return v;
  }
  return getValorEfetivo(c.valor_contrato || 0, adjustments, y, m);
}