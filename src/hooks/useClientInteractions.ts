import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Interaction {
  id: string;
  client_id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data: string;
  created_by: string | null;
  created_at: string;
}

export type InteractionInsert = Omit<Interaction, "id" | "created_at" | "created_by">;

export const INTERACTION_TYPES = [
  { id: "reuniao", label: "Reunião", icon: "Users", color: "bg-blue-500/15 text-blue-600" },
  { id: "ligacao", label: "Ligação", icon: "Phone", color: "bg-green-500/15 text-green-600" },
  { id: "email", label: "E-mail", icon: "Mail", color: "bg-purple-500/15 text-purple-600" },
  { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle", color: "bg-emerald-500/15 text-emerald-600" },
  { id: "nota", label: "Nota Interna", icon: "StickyNote", color: "bg-yellow-500/15 text-yellow-600" },
];

export function useClientInteractions(clientId: string) {
  const qc = useQueryClient();
  const key = ["client_interactions", clientId];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_interactions")
        .select("*")
        .eq("client_id", clientId)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data || []) as Interaction[];
    },
    enabled: !!clientId,
  });

  const addInteraction = useMutation({
    mutationFn: async (input: InteractionInsert) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("client_interactions").insert({
        ...input,
        created_by: userData.user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteInteraction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_interactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    interactions: query.data || [],
    isLoading: query.isLoading,
    addInteraction,
    deleteInteraction,
  };
}
