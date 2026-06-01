import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LovableProduct {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  status: string;
  url_app: string | null;
  thumbnail_url: string | null;
  video_demo_url: string | null;
  stack: string[];
  cliente_origem_id: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LovableProductClient {
  product_id: string;
  client_id: string;
  data_replicacao: string | null;
  notas: string | null;
  created_at: string;
}

export type LovableProductInsert = Omit<LovableProduct, "id" | "created_at" | "updated_at" | "created_by">;

export function useLovableProducts() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["lovable_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LovableProduct[];
    },
  });

  const { data: links = [] } = useQuery({
    queryKey: ["lovable_product_clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lovable_product_clients").select("*");
      if (error) throw error;
      return (data || []) as LovableProductClient[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["lovable_products"] });
    qc.invalidateQueries({ queryKey: ["lovable_product_clients"] });
  };

  const addProduct = useMutation({
    mutationFn: async ({ values, clientIds }: { values: LovableProductInsert; clientIds: string[] }) => {
      const { data, error } = await supabase
        .from("lovable_products")
        .insert({ ...values, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      if (clientIds.length) {
        const rows = clientIds.map((cid) => ({ product_id: data.id, client_id: cid }));
        const { error: e2 } = await supabase.from("lovable_product_clients").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: invalidate,
  });

  const editProduct = useMutation({
    mutationFn: async ({ id, values, clientIds }: { id: string; values: Partial<LovableProductInsert>; clientIds?: string[] }) => {
      const { error } = await supabase.from("lovable_products").update(values).eq("id", id);
      if (error) throw error;
      if (clientIds) {
        await supabase.from("lovable_product_clients").delete().eq("product_id", id);
        if (clientIds.length) {
          const rows = clientIds.map((cid) => ({ product_id: id, client_id: cid }));
          const { error: e2 } = await supabase.from("lovable_product_clients").insert(rows);
          if (e2) throw e2;
        }
      }
    },
    onSuccess: invalidate,
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lovable_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const linkClient = useMutation({
    mutationFn: async ({ product_id, client_id }: { product_id: string; client_id: string }) => {
      const { error } = await supabase
        .from("lovable_product_clients")
        .insert({ product_id, client_id, data_replicacao: new Date().toISOString().slice(0, 10) });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const unlinkClient = useMutation({
    mutationFn: async ({ product_id, client_id }: { product_id: string; client_id: string }) => {
      const { error } = await supabase
        .from("lovable_product_clients")
        .delete()
        .eq("product_id", product_id)
        .eq("client_id", client_id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const renameCategory = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error } = await supabase
        .from("lovable_products")
        .update({ categoria: newName })
        .eq("categoria", oldName);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const clientIdsFor = (productId: string) =>
    links.filter((l) => l.product_id === productId).map((l) => l.client_id);

  const productsForClient = (clientId: string) =>
    products.filter((p) => links.some((l) => l.product_id === p.id && l.client_id === clientId));

  return {
    products,
    links,
    isLoading,
    addProduct,
    editProduct,
    deleteProduct,
    linkClient,
    unlinkClient,
    renameCategory,
    clientIdsFor,
    productsForClient,
  };
}