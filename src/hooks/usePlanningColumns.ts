import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanningColumn {
  id: string;
  label: string;
  color: string;
  position: number;
}

export function usePlanningColumns() {
  const qc = useQueryClient();
  const key = ["planning_columns"];

  const { data: columns = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_columns")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as PlanningColumn[];
    },
  });

  const addColumn = useMutation({
    mutationFn: async (col: { label: string; color: string }) => {
      const { error } = await supabase.from("planning_columns").insert({
        label: col.label,
        color: col.color,
        position: columns.length,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanningColumn> }) => {
      const { error } = await supabase.from("planning_columns").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planning_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const reorderColumns = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, i) =>
        supabase.from("planning_columns").update({ position: i }).eq("id", id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { columns, isLoading, addColumn, updateColumn, deleteColumn, reorderColumns };
}
