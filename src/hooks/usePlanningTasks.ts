import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  column_id: string;
  position: number;
  priority: string;
  assigned_to: string | null;
  due_date: string | null;
  labels: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePlanningTasks() {
  const qc = useQueryClient();
  const key = ["planning_tasks"];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_tasks")
        .select("*")
        .order("position");
      if (error) throw error;
      return data as PlanningTask[];
    },
  });

  const addTask = useMutation({
    mutationFn: async (task: { title: string; column_id: string; description?: string; priority?: string; due_date?: string; labels?: string[] }) => {
      const tasksInColumn = tasks.filter(t => t.column_id === task.column_id);
      const { error } = await supabase.from("planning_tasks").insert({
        ...task,
        position: tasksInColumn.length,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanningTask> }) => {
      const { error } = await supabase.from("planning_tasks").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planning_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const moveTask = useMutation({
    mutationFn: async ({ taskId, newColumnId, newPosition }: { taskId: string; newColumnId: string; newPosition: number }) => {
      const { error } = await supabase.from("planning_tasks").update({
        column_id: newColumnId,
        position: newPosition,
        updated_at: new Date().toISOString(),
      }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { tasks, isLoading, addTask, updateTask, deleteTask, moveTask };
}
