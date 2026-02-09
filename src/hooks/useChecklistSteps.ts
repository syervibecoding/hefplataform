import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ChecklistTipo } from "./useClientChecklist";

export interface ChecklistStep {
  id: string;
  tipo: string;
  label: string;
  position: number;
}

export function useChecklistSteps(tipo: ChecklistTipo) {
  const qc = useQueryClient();
  const key = ["checklist-steps", tipo];

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ChecklistStep[]> => {
      const { data, error } = await supabase
        .from("checklist_steps")
        .select("*")
        .eq("tipo", tipo)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as ChecklistStep[];
    },
  });

  const addStep = useMutation({
    mutationFn: async (label: string) => {
      const maxPos = (query.data || []).reduce((max, s) => Math.max(max, s.position), 0);
      const { error } = await supabase
        .from("checklist_steps")
        .insert({ tipo, label, position: maxPos + 1 });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const removeStep = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from("checklist_steps")
        .delete()
        .eq("id", stepId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    steps: query.data || [],
    isLoading: query.isLoading,
    addStep: (label: string) => addStep.mutate(label),
    removeStep: (stepId: string) => removeStep.mutate(stepId),
    isAdding: addStep.isPending,
  };
}
