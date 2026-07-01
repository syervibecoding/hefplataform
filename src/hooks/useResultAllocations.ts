import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResultAllocation {
  id: string;
  nome: string;
  percentual: number;
  cor: string;
  ordem: number;
}

export function useResultAllocations(enabled: boolean) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["result_allocations"],
    enabled,
    queryFn: async (): Promise<ResultAllocation[]> => {
      const { data, error } = await supabase
        .from("result_allocations")
        .select("id, nome, percentual, cor, ordem")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id, nome: r.nome, percentual: Number(r.percentual), cor: r.cor, ordem: r.ordem,
      }));
    },
    staleTime: 60000,
  });

  const create = useMutation({
    mutationFn: async (row: Omit<ResultAllocation, "id">) => {
      const { error } = await supabase.from("result_allocations").insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["result_allocations"] }),
  });

  const update = useMutation({
    mutationFn: async (row: ResultAllocation) => {
      const { id, ...rest } = row;
      const { error } = await supabase.from("result_allocations").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["result_allocations"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("result_allocations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["result_allocations"] }),
  });

  return { allocations: query.data || [], isLoading: query.isLoading, create, update, remove };
}

export const ALLOCATION_COLORS = [
  { value: "bg-primary", label: "Roxo" },
  { value: "bg-hef-info", label: "Azul" },
  { value: "bg-hef-success", label: "Verde" },
  { value: "bg-hef-warning", label: "Amarelo" },
  { value: "bg-destructive", label: "Vermelho" },
  { value: "bg-purple-500", label: "Roxo claro" },
  { value: "bg-pink-500", label: "Rosa" },
  { value: "bg-cyan-500", label: "Ciano" },
];
