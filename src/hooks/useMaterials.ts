import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Material {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  url: string;
  product_id: string | null;
  categoria: string | null;
  created_by: string | null;
  created_at: string;
}

export type MaterialInsert = Omit<Material, "id" | "created_at" | "created_by">;

export function useMaterials(productFilter?: string | null, categoriaFilter?: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["materials", productFilter, categoriaFilter],
    queryFn: async () => {
      let q = supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (productFilter) q = q.eq("product_id", productFilter);
      if (categoriaFilter) q = q.eq("categoria", categoriaFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Material[];
    },
  });

  const addMaterial = useMutation({
    mutationFn: async (values: MaterialInsert) => {
      const { error } = await supabase.from("materials").insert({
        ...values,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });

  const editMaterial = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaterialInsert> }) => {
      const { error } = await supabase.from("materials").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });

  // Get unique categorias from all materials (no filter)
  const { data: allMaterials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Material[];
    },
  });

  const categorias = Array.from(new Set(allMaterials.map((m) => m.categoria).filter(Boolean))) as string[];

  return { materials, isLoading, addMaterial, editMaterial, deleteMaterial, categorias };
}
