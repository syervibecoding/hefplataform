import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientReportSettings {
  id: string;
  client_id: string;
  titulo: string | null;
  subtitulo: string | null;
  data_referencia: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  introducao: string | null;
  conclusao: string | null;
}

export interface ClientReportItem {
  id: string;
  client_id: string;
  item_key: string;
  kind: string;
  titulo: string | null;
  descricao: string | null;
  data: string | null;
  hidden: boolean;
  manual: boolean;
}

export function useClientReport(clientId: string | null) {
  const qc = useQueryClient();

  const settings = useQuery({
    queryKey: ["client_report_settings", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_report_settings")
        .select("*")
        .eq("client_id", clientId!)
        .maybeSingle();
      if (error) throw error;
      return (data as ClientReportSettings | null) ?? null;
    },
  });

  const items = useQuery({
    queryKey: ["client_report_items", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_report_items")
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw error;
      return (data || []) as ClientReportItem[];
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (values: Partial<ClientReportSettings>) => {
      const { error } = await supabase
        .from("client_report_settings")
        .upsert({ client_id: clientId!, ...values } as any, { onConflict: "client_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_report_settings", clientId] }),
  });

  const saveItem = useMutation({
    mutationFn: async (values: Partial<ClientReportItem> & { item_key: string }) => {
      const { error } = await supabase
        .from("client_report_items")
        .upsert({ client_id: clientId!, ...values } as any, { onConflict: "client_id,item_key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_report_items", clientId] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_report_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_report_items", clientId] }),
  });

  return {
    settings: settings.data ?? null,
    items: items.data ?? [],
    isLoading: settings.isLoading || items.isLoading,
    saveSettings,
    saveItem,
    deleteItem,
  };
}