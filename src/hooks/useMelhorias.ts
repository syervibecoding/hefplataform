import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Melhoria, type MelhoriaStatus } from "@/data/constants";

function mapRow(row: any): Melhoria {
  return {
    id: row.id,
    titulo: row.titulo,
    prioridade: row.prioridade,
    status: row.status,
    tipo: row.tipo,
  };
}

export function useMelhorias() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["melhorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("melhorias")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

  const addMelhoria = useMutation({
    mutationFn: async (data: Omit<Melhoria, "id">) => {
      const { error } = await supabase.from("melhorias").insert({
        titulo: data.titulo,
        prioridade: data.prioridade,
        status: data.status,
        tipo: data.tipo,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["melhorias"] }),
  });

  const editMelhoria = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Melhoria> }) => {
      const row: any = {};
      if (data.titulo !== undefined) row.titulo = data.titulo;
      if (data.prioridade !== undefined) row.prioridade = data.prioridade;
      if (data.status !== undefined) row.status = data.status;
      if (data.tipo !== undefined) row.tipo = data.tipo;
      const { error } = await supabase.from("melhorias").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["melhorias"] }),
  });

  const deleteMelhoria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("melhorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["melhorias"] }),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MelhoriaStatus }) => {
      const { error } = await supabase.from("melhorias").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["melhorias"] }),
  });

  return {
    melhorias: query.data || [],
    isLoading: query.isLoading,
    addMelhoria,
    editMelhoria,
    deleteMelhoria,
    changeStatus,
  };
}
