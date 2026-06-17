import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PlatformLink {
  label: string;
  url: string;
}

export interface PlatformFile {
  id: string;
  product_id: string;
  nome: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface PlatformCredential {
  id: string;
  product_id: string;
  label: string;
  usuario: string | null;
  senha: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

const BUCKET = "platform-files";

export function usePlatformFiles(productId: string | null) {
  return useQuery({
    queryKey: ["platform_files", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_files")
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PlatformFile[];
    },
  });
}

export function usePlatformCredentials(productId: string | null) {
  return useQuery({
    queryKey: ["platform_credentials", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("product_id", productId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as PlatformCredential[];
    },
  });
}

export function usePlatformMutations() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const invalidate = (productId: string) => {
    qc.invalidateQueries({ queryKey: ["platform_files", productId] });
    qc.invalidateQueries({ queryKey: ["platform_credentials", productId] });
  };

  const uploadFile = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${productId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error } = await supabase.from("platform_files").insert({
        product_id: productId,
        nome: file.name,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => invalidate(v.productId),
  });

  const deleteFile = useMutation({
    mutationFn: async (f: PlatformFile) => {
      await supabase.storage.from(BUCKET).remove([f.storage_path]);
      const { error } = await supabase.from("platform_files").delete().eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => invalidate(v.product_id),
  });

  const downloadFile = async (f: PlatformFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.storage_path, 60);
    if (error) throw error;
    window.open(data.signedUrl, "_blank");
  };

  const upsertCredential = useMutation({
    mutationFn: async (
      cred: Partial<PlatformCredential> & { product_id: string; label: string }
    ) => {
      if (cred.id) {
        const { error } = await supabase
          .from("platform_credentials")
          .update({
            label: cred.label,
            usuario: cred.usuario ?? null,
            senha: cred.senha ?? null,
            notas: cred.notas ?? null,
          })
          .eq("id", cred.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("platform_credentials").insert({
          product_id: cred.product_id,
          label: cred.label,
          usuario: cred.usuario ?? null,
          senha: cred.senha ?? null,
          notas: cred.notas ?? null,
          created_by: user?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => invalidate(v.product_id),
  });

  const deleteCredential = useMutation({
    mutationFn: async (c: PlatformCredential) => {
      const { error } = await supabase.from("platform_credentials").delete().eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => invalidate(v.product_id),
  });

  const updateLinks = useMutation({
    mutationFn: async ({ productId, links }: { productId: string; links: PlatformLink[] }) => {
      const { error } = await supabase
        .from("lovable_products")
        .update({ links: links as any })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lovable_products"] });
    },
  });

  return { uploadFile, deleteFile, downloadFile, upsertCredential, deleteCredential, updateLinks };
}