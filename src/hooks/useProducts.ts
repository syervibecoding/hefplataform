import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  icon: string;
  position: number;
  config: Record<string, any>;
}

export function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as Product[];
    },
  });

  const addProduct = useMutation({
    mutationFn: async (product: Omit<Product, "config"> & { config?: Record<string, any> }) => {
      const { error } = await supabase.from("products").insert({
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        icon: product.icon,
        position: product.position,
        config: product.config || {},
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const editProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  return {
    products: query.data || [],
    isLoading: query.isLoading,
    addProduct,
    editProduct,
    deleteProduct,
  };
}
