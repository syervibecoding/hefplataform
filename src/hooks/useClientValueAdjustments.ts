import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientValueAdjustment {
  id: string;
  client_id: string;
  data_inicio: string;
  novo_valor: number;
}

export function useClientValueAdjustments(clientId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["client-value-adjustments", clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ClientValueAdjustment[]> => {
      const { data, error } = await supabase
        .from("client_value_adjustments")
        .select("id, client_id, data_inicio, novo_valor")
        .eq("client_id", clientId as string)
        .order("data_inicio", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({ ...r, novo_valor: Number(r.novo_valor) }));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["client-value-adjustments"] });
    qc.invalidateQueries({ queryKey: ["cash-flow"] });
    qc.invalidateQueries({ queryKey: ["clients"] });
  };

  const addAdjustment = useMutation({
    mutationFn: async (input: { data_inicio: string; novo_valor: number }) => {
      const { error } = await supabase.from("client_value_adjustments").insert({
        client_id: clientId,
        data_inicio: input.data_inicio,
        novo_valor: input.novo_valor,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateAdjustment = useMutation({
    mutationFn: async (input: { id: string; data_inicio: string; novo_valor: number }) => {
      const { error } = await supabase
        .from("client_value_adjustments")
        .update({ data_inicio: input.data_inicio, novo_valor: input.novo_valor } as any)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_value_adjustments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ...query, addAdjustment, updateAdjustment, deleteAdjustment };
}

export function useClientValueAdjustmentsForClients(clientIds: string[]) {
  const uniqueClientIds = Array.from(new Set(clientIds)).sort();

  return useQuery({
    queryKey: ["client-value-adjustments", "clients", uniqueClientIds],
    enabled: uniqueClientIds.length > 0,
    queryFn: async (): Promise<ClientValueAdjustment[]> => {
      const { data, error } = await supabase
        .from("client_value_adjustments")
        .select("id, client_id, data_inicio, novo_valor")
        .in("client_id", uniqueClientIds)
        .order("data_inicio", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({ ...r, novo_valor: Number(r.novo_valor) }));
    },
  });
}