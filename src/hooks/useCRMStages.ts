import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CRMStage {
  id: string;
  label: string;
  color: string;
  position: number;
}

const STAGE_COLORS = [
  "bg-blue-500/15 text-blue-600 border-blue-500/20",
  "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  "bg-purple-500/15 text-purple-600 border-purple-500/20",
  "bg-orange-500/15 text-orange-600 border-orange-500/20",
  "bg-pink-500/15 text-pink-600 border-pink-500/20",
  "bg-teal-500/15 text-teal-600 border-teal-500/20",
  "bg-cyan-500/15 text-cyan-600 border-cyan-500/20",
  "bg-green-500/15 text-green-600 border-green-500/20",
  "bg-red-500/15 text-red-600 border-red-500/20",
];

export function useCRMStages() {
  const queryClient = useQueryClient();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["crm_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_stages")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data as CRMStage[];
    },
  });

  const addStage = useMutation({
    mutationFn: async (label: string) => {
      const id = label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      const position = stages.length;
      const color = STAGE_COLORS[position % STAGE_COLORS.length];
      const { error } = await supabase.from("crm_stages").insert({ id, label, color, position });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm_stages"] }),
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm_stages"] }),
  });

  const reorderStages = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, i) =>
        supabase.from("crm_stages").update({ position: i }).eq("id", id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm_stages"] }),
  });

  return { stages, isLoading: isLoading, addStage, deleteStage, reorderStages };
}
