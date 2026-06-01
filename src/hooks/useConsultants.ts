import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Consultant {
  id: string;
  profileId: string;
  cor: string;
  ativo: boolean;
  displayName: string;
  username: string;
}

export function useConsultants() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["consultants"],
    queryFn: async (): Promise<Consultant[]> => {
      const { data, error } = await supabase
        .from("consultants")
        .select("id, profile_id, cor, ativo");
      if (error) throw error;
      const rows = data || [];
      if (rows.length === 0) return [];
      const ids = rows.map((r) => r.profile_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", ids);
      const pmap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return rows.map((r: any) => ({
        id: r.id,
        profileId: r.profile_id,
        cor: r.cor,
        ativo: r.ativo,
        displayName: pmap.get(r.profile_id)?.display_name || pmap.get(r.profile_id)?.username || "—",
        username: pmap.get(r.profile_id)?.username || "",
      }));
    },
  });

  const addConsultant = useMutation({
    mutationFn: async ({ profileId, cor }: { profileId: string; cor: string }) => {
      const { error } = await supabase.from("consultants").insert({ profile_id: profileId, cor });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
  });

  const updateConsultant = useMutation({
    mutationFn: async ({ id, cor, ativo }: { id: string; cor?: string; ativo?: boolean }) => {
      const patch: any = {};
      if (cor !== undefined) patch.cor = cor;
      if (ativo !== undefined) patch.ativo = ativo;
      const { error } = await supabase.from("consultants").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
  });

  const deleteConsultant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consultants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["consultants"] }),
  });

  return {
    consultants: query.data || [],
    isLoading: query.isLoading,
    addConsultant,
    updateConsultant,
    deleteConsultant,
  };
}

export const CONSULTANT_COLORS = [
  { value: "bg-primary/20 text-primary border-primary/30", label: "Violeta" },
  { value: "bg-hef-info/20 text-hef-info border-hef-info/30", label: "Azul" },
  { value: "bg-hef-success/20 text-hef-success border-hef-success/30", label: "Verde" },
  { value: "bg-hef-warning/20 text-hef-warning border-hef-warning/30", label: "Amarelo" },
  { value: "bg-destructive/20 text-destructive border-destructive/30", label: "Vermelho" },
];