import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChecklistTipo = "certidoes" | "caixas_postais";

export interface StepInfo {
  done: boolean;
  user_id?: string;
  username?: string;
  at?: string;
}

export interface ChecklistRecord {
  id: string;
  client_id: string;
  tipo: ChecklistTipo;
  periodo: string;
  steps: Record<string, boolean | StepInfo>;
}

function isStepInfo(v: unknown): v is StepInfo {
  return typeof v === "object" && v !== null && "done" in v;
}

export function isStepDone(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (isStepInfo(v)) return v.done;
  return false;
}

export function getStepInfo(v: unknown): StepInfo | null {
  if (isStepInfo(v)) return v;
  return null;
}

export function useClientChecklist(clientId: string, tipo: ChecklistTipo, periodo: string) {
  const qc = useQueryClient();
  const key = ["client-checklist", clientId, tipo, periodo];

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ChecklistRecord | null> => {
      const { data, error } = await supabase
        .from("client_checklists")
        .select("*")
        .eq("client_id", clientId)
        .eq("tipo", tipo)
        .eq("periodo", periodo)
        .maybeSingle();
      if (error) throw error;
      return data
        ? { ...data, tipo: data.tipo as ChecklistTipo, steps: (data.steps as Record<string, boolean | StepInfo>) || {} }
        : null;
    },
  });

  const toggleStep = useMutation({
    mutationFn: async ({ stepId, userId, username }: { stepId: string; userId: string; username: string }) => {
      const current = query.data;
      const currentVal = current?.steps?.[stepId];
      const wasDone = isStepDone(currentVal);

      const newStepValue: StepInfo | boolean = wasDone
        ? { done: false }
        : { done: true, user_id: userId, username, at: new Date().toISOString() };

      const newSteps = { ...(current?.steps || {}), [stepId]: newStepValue };

      if (current?.id) {
        const { error } = await supabase
          .from("client_checklists")
          .update({ steps: newSteps as any })
          .eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_checklists")
          .insert({ client_id: clientId, tipo, periodo, steps: newSteps as any });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    checklist: query.data,
    isLoading: query.isLoading,
    toggleStep: (stepId: string, userId: string, username: string) =>
      toggleStep.mutate({ stepId, userId, username }),
  };
}

/** Reconcile orphan checklists when schedule dates change */
export function useReconcileChecklists(clientId: string, tipo: ChecklistTipo, currentDates: string[]) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["reconcile-checklists", clientId, tipo, ...currentDates],
    queryFn: async () => {
      if (currentDates.length === 0) return null;

      // Get the month range from current dates
      const months = new Set(currentDates.map((d) => d.substring(0, 7)));

      // Fetch all existing records for these months
      const allRecords: any[] = [];
      for (const month of months) {
        const { data } = await supabase
          .from("client_checklists")
          .select("*")
          .eq("client_id", clientId)
          .eq("tipo", tipo)
          .like("periodo", `${month}%`);
        if (data) allRecords.push(...data);
      }

      // Find orphans: records whose periodo is not in currentDates
      const orphans = allRecords.filter((r) => !currentDates.includes(r.periodo));
      // Find missing: dates that have no record
      const existingDates = new Set(allRecords.map((r) => r.periodo));
      const missing = currentDates.filter((d) => !existingDates.has(d));

      // Match orphans to missing dates (same month, closest day)
      for (const orphan of orphans) {
        const orphanMonth = orphan.periodo.substring(0, 7);
        const target = missing.find((m) => m.substring(0, 7) === orphanMonth);
        if (target) {
          // Move the orphan to the new date
          await supabase
            .from("client_checklists")
            .update({ periodo: target })
            .eq("id", orphan.id);
          missing.splice(missing.indexOf(target), 1);
        }
      }

      // Invalidate to reload fresh data
      qc.invalidateQueries({ queryKey: ["client-checklist", clientId, tipo] });
      return true;
    },
    staleTime: 60000, // Only reconcile once per minute
  });
}
