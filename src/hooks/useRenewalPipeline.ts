import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Renewal {
  id: string;
  client_id: string;
  status: string;
  data_vencimento: string | null;
  valor_renovacao: number | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type RenewalInsert = Pick<Renewal, "client_id"> & Partial<Pick<Renewal, "status" | "data_vencimento" | "valor_renovacao" | "notas">>;

export const RENEWAL_STAGES = [
  { id: "renovar", label: "A Renovar", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  { id: "em_negociacao", label: "Em Negociação", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  { id: "renovado", label: "Renovado", color: "bg-green-500/15 text-green-600 border-green-500/20" },
  { id: "churn", label: "Churn", color: "bg-red-500/15 text-red-600 border-red-500/20" },
];

export function useRenewalPipeline() {
  const qc = useQueryClient();
  const key = ["renewal_pipeline"];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("renewal_pipeline")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Renewal[];
    },
  });

  const addRenewal = useMutation({
    mutationFn: async (input: RenewalInsert) => {
      const { error } = await supabase.from("renewal_pipeline").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const moveRenewal = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("renewal_pipeline").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteRenewal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("renewal_pipeline").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    renewals: query.data || [],
    isLoading: query.isLoading,
    addRenewal,
    moveRenewal,
    deleteRenewal,
  };
}
