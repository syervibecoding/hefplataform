import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MaterialFolder {
  id: string;
  nome: string;
  cor: string;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useMaterialFolders() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["material_folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_folders")
        .select("*")
        .order("position", { ascending: true })
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as MaterialFolder[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["material_folders"] });
    qc.invalidateQueries({ queryKey: ["materials"] });
  };

  const addFolder = useMutation({
    mutationFn: async (values: { nome: string; cor?: string }) => {
      const { error } = await supabase.from("material_folders").insert({
        nome: values.nome,
        cor: values.cor ?? "#8b5cf6",
        position: folders.length,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const editFolder = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Pick<MaterialFolder, "nome" | "cor" | "position">> }) => {
      const { error } = await supabase.from("material_folders").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { folders, isLoading, addFolder, editFolder, deleteFolder };
}
