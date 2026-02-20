import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ChecklistTipo = string;

export interface StepInfo {
  done: boolean;
  user_id?: string;
  username?: string;
  at?: string;
}

export interface CustomStep {
  id: string;
  label: string;
}

export interface ChecklistRecord {
  id: string;
  client_id: string;
  tipo: ChecklistTipo;
  periodo: string;
  steps: Record<string, boolean | StepInfo | CustomStep[]>;
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

export function getCustomSteps(steps: Record<string, any>): CustomStep[] {
  const raw = steps?._custom_steps;
  if (Array.isArray(raw)) return raw as CustomStep[];
  return [];
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

  const addCustomStep = useMutation({
    mutationFn: async (label: string) => {
      const current = query.data;
      const currentSteps = { ...(current?.steps || {}) };
      const customSteps = getCustomSteps(currentSteps);
      const newCustomStep: CustomStep = { id: `custom_${Date.now()}`, label };
      const updatedCustomSteps = [...customSteps, newCustomStep];
      const newSteps = { ...currentSteps, _custom_steps: updatedCustomSteps };

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

  const removeCustomStep = useMutation({
    mutationFn: async (stepId: string) => {
      const current = query.data;
      if (!current?.id) return;
      const currentSteps = { ...(current.steps || {}) };
      const customSteps = getCustomSteps(currentSteps).filter((s) => s.id !== stepId);
      const { [stepId]: _removed, ...restSteps } = currentSteps;
      const newSteps = { ...restSteps, _custom_steps: customSteps };

      const { error } = await supabase
        .from("client_checklists")
        .update({ steps: newSteps as any })
        .eq("id", current.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const editCustomStep = useMutation({
    mutationFn: async ({ stepId, label }: { stepId: string; label: string }) => {
      const current = query.data;
      if (!current?.id) return;
      const currentSteps = { ...(current.steps || {}) };
      const customSteps = getCustomSteps(currentSteps).map((s) =>
        s.id === stepId ? { ...s, label } : s
      );
      const newSteps = { ...currentSteps, _custom_steps: customSteps };

      const { error } = await supabase
        .from("client_checklists")
        .update({ steps: newSteps as any })
        .eq("id", current.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    checklist: query.data,
    isLoading: query.isLoading,
    toggleStep: (stepId: string, userId: string, username: string) =>
      toggleStep.mutate({ stepId, userId, username }),
    addCustomStep: (label: string) => addCustomStep.mutate(label),
    removeCustomStep: (stepId: string) => removeCustomStep.mutate(stepId),
    editCustomStep: (stepId: string, label: string) => editCustomStep.mutate({ stepId, label }),
    isAddingCustom: addCustomStep.isPending,
  };
}

/** Reconcile orphan checklists when schedule dates change */
export function useReconcileChecklists(clientId: string, tipo: ChecklistTipo, currentDates: string[]) {
  const qc = useQueryClient();

  return useQuery({
    queryKey: ["reconcile-checklists", clientId, tipo, ...currentDates],
    queryFn: async () => {
      if (currentDates.length === 0) return null;

      const months = new Set(currentDates.map((d) => d.substring(0, 7)));

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

      const orphans = allRecords.filter((r) => !currentDates.includes(r.periodo));
      const existingDates = new Set(allRecords.map((r) => r.periodo));
      const missing = currentDates.filter((d) => !existingDates.has(d));

      for (const orphan of orphans) {
        const orphanMonth = orphan.periodo.substring(0, 7);
        const target = missing.find((m) => m.substring(0, 7) === orphanMonth);
        if (target) {
          await supabase
            .from("client_checklists")
            .update({ periodo: target })
            .eq("id", orphan.id);
          missing.splice(missing.indexOf(target), 1);
        }
      }

      qc.invalidateQueries({ queryKey: ["client-checklist", clientId, tipo] });
      return true;
    },
    staleTime: 60000,
  });
}
