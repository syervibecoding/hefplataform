import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChecklistTipo = "certidoes" | "caixas_postais";

export interface ChecklistRecord {
  id: string;
  client_id: string;
  tipo: ChecklistTipo;
  periodo: string;
  steps: Record<string, boolean>;
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useClientChecklist(clientId: string, tipo: ChecklistTipo, periodo?: string) {
  const qc = useQueryClient();
  const per = periodo || currentPeriod();
  const key = ["client-checklist", clientId, tipo, per];

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ChecklistRecord | null> => {
      const { data, error } = await supabase
        .from("client_checklists")
        .select("*")
        .eq("client_id", clientId)
        .eq("tipo", tipo)
        .eq("periodo", per)
        .maybeSingle();
      if (error) throw error;
      return data ? { ...data, tipo: data.tipo as ChecklistTipo, steps: (data.steps as Record<string, boolean>) || {} } : null;
    },
  });

  const toggleStep = useMutation({
    mutationFn: async (stepId: string) => {
      const current = query.data;
      const newSteps = { ...(current?.steps || {}), [stepId]: !(current?.steps?.[stepId]) };

      if (current?.id) {
        const { error } = await supabase
          .from("client_checklists")
          .update({ steps: newSteps as any })
          .eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_checklists")
          .insert({ client_id: clientId, tipo: tipo, periodo: per, steps: newSteps as any });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { checklist: query.data, isLoading: query.isLoading, toggleStep: toggleStep.mutate };
}
