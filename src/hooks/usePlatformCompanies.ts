import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlatformCompany {
  id: string;
  nome: string;
  email: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyProductLink {
  id: string;
  company_id: string;
  product_id: string;
}

export function usePlatformCompanies() {
  return useQuery({
    queryKey: ["platform_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_companies")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as PlatformCompany[];
    },
  });
}

export function useCompanyProductLinks() {
  return useQuery({
    queryKey: ["platform_company_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_company_products")
        .select("id, company_id, product_id");
      if (error) throw error;
      return (data ?? []) as CompanyProductLink[];
    },
  });
}

export function usePlatformCompanyMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["platform_companies"] });
    qc.invalidateQueries({ queryKey: ["platform_company_products"] });
  };

  const create = useMutation({
    mutationFn: async (input: { nome: string; email?: string; observacoes?: string }) => {
      const { data, error } = await supabase
        .from("platform_companies")
        .insert({
          nome: input.nome.trim(),
          email: input.email?.trim() || null,
          observacoes: input.observacoes?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PlatformCompany;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Empresa criada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar"),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<PlatformCompany> }) => {
      const { error } = await supabase.from("platform_companies").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Empresa atualizada");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("platform_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Empresa removida");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover"),
  });

  const linkProduct = useMutation({
    mutationFn: async ({ company_id, product_id }: { company_id: string; product_id: string }) => {
      const { error } = await supabase
        .from("platform_company_products")
        .insert({ company_id, product_id });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message ?? "Erro ao liberar plataforma"),
  });

  const unlinkProduct = useMutation({
    mutationFn: async ({ company_id, product_id }: { company_id: string; product_id: string }) => {
      const { error } = await supabase
        .from("platform_company_products")
        .delete()
        .eq("company_id", company_id)
        .eq("product_id", product_id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e.message ?? "Erro ao remover liberação"),
  });

  return { create, update, remove, linkProduct, unlinkProduct };
}