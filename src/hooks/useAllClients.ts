import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export type HealthStatus = "saudavel" | "atencao" | "critico";

export function calculateHealthScore(client: ClientRow): { status: HealthStatus; label: string; color: string } {
  let score = 100;

  // Status check (most important)
  if (client.status !== "ativo") {
    score -= 50;
  }

  // Difficulty level
  if (client.nivel_dificuldade === "dificil") {
    score -= 30;
  } else if (client.nivel_dificuldade === "medio") {
    score -= 10;
  }

  // Contact info completeness
  if (!client.whatsapp && !client.email) {
    score -= 15;
  }

  // Contract value (if 0, might indicate an issue)
  if (!client.valor_contrato && !client.faturamento) {
    score -= 5;
  }

  if (score >= 70) {
    return { status: "saudavel", label: "Saudável", color: "bg-green-500/15 text-green-600 border-green-500/20" };
  } else if (score >= 40) {
    return { status: "atencao", label: "Atenção", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" };
  } else {
    return { status: "critico", label: "Crítico", color: "bg-red-500/15 text-red-600 border-red-500/20" };
  }
}

export function useAllClients(productFilter?: string | null) {
  return useQuery({
    queryKey: ["all_clients", productFilter],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("id, nome, contato, whatsapp, email, status, product_id, valor_contrato, faturamento, nivel_dificuldade, data_golive, data_kickoff, created_at")
        .order("created_at", { ascending: false });

      if (productFilter) {
        query = query.eq("product_id", productFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ClientRow[];
    },
  });
}
