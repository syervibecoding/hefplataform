import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Prospect {
  id: string;
  nome: string;
  contato: string | null;
  whatsapp: string | null;
  email: string | null;
  product_id: string | null;
  status: string;
  origem: string | null;
  valor_estimado: number | null;
  notas: string | null;
  data_contato: string | null;
  data_followup: string | null;
  created_at: string;
  updated_at: string;
}

export type ProspectInsert = Omit<Prospect, "id" | "created_at" | "updated_at">;

export const FUNNEL_STAGES = [
  { id: "novo_lead", label: "Lead Identificado", color: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
  { id: "contato_feito", label: "Contato Feito", color: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
  { id: "reuniao_agendada", label: "Reunião Agendada", color: "bg-purple-500/15 text-purple-600 border-purple-500/20" },
  { id: "proposta_enviada", label: "Proposta Enviada", color: "bg-orange-500/15 text-orange-600 border-orange-500/20" },
  { id: "negociacao", label: "Negociação", color: "bg-pink-500/15 text-pink-600 border-pink-500/20" },
  { id: "ganho", label: "Convertido", color: "bg-green-500/15 text-green-600 border-green-500/20" },
  { id: "perdido", label: "Perdido", color: "bg-red-500/15 text-red-600 border-red-500/20" },
] as const;

export function useProspects(productFilter?: string | null) {
  const queryClient = useQueryClient();

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ["prospects", productFilter],
    queryFn: async () => {
      let q = supabase.from("prospects").select("*").order("created_at", { ascending: false });
      if (productFilter) q = q.eq("product_id", productFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Prospect[];
    },
  });

  const addProspect = useMutation({
    mutationFn: async (values: ProspectInsert) => {
      const { error } = await supabase.from("prospects").insert(values);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const editProspect = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProspectInsert> }) => {
      const { error } = await supabase.from("prospects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const deleteProspect = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prospects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const moveProspect = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("prospects").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospects"] }),
  });

  return { prospects, isLoading, addProspect, editProspect, deleteProspect, moveProspect };
}
