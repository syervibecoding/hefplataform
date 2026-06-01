import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConsultoriaSlot {
  id: string;
  clientId: string;
  consultantId: string;
  diaSemana: number; // 0=Dom..6=Sáb
  turno: "manha" | "tarde";
  dataInicio: string | null;
  dataFim: string | null;
}

function mapRow(r: any): ConsultoriaSlot {
  return {
    id: r.id,
    clientId: r.client_id,
    consultantId: r.consultant_id,
    diaSemana: r.dia_semana,
    turno: r.turno,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim,
  };
}

export function useAllConsultoriaSlots() {
  return useQuery({
    queryKey: ["consultoria_slots"],
    queryFn: async (): Promise<ConsultoriaSlot[]> => {
      const { data, error } = await supabase.from("consultoria_slots").select("*");
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

export function useClientConsultoriaSlots(clientId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["consultoria_slots", "client", clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ConsultoriaSlot[]> => {
      const { data, error } = await supabase
        .from("consultoria_slots")
        .select("*")
        .eq("client_id", clientId!);
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["consultoria_slots"] });
    queryClient.invalidateQueries({ queryKey: ["consultoria_slots", "client", clientId] });
  };

  const addSlot = useMutation({
    mutationFn: async (slot: Omit<ConsultoriaSlot, "id">) => {
      const { error } = await supabase.from("consultoria_slots").insert({
        client_id: slot.clientId,
        consultant_id: slot.consultantId,
        dia_semana: slot.diaSemana,
        turno: slot.turno,
        data_inicio: slot.dataInicio,
        data_fim: slot.dataFim,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateSlot = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ConsultoriaSlot> }) => {
      const row: any = {};
      if (patch.consultantId !== undefined) row.consultant_id = patch.consultantId;
      if (patch.diaSemana !== undefined) row.dia_semana = patch.diaSemana;
      if (patch.turno !== undefined) row.turno = patch.turno;
      if (patch.dataInicio !== undefined) row.data_inicio = patch.dataInicio;
      if (patch.dataFim !== undefined) row.data_fim = patch.dataFim;
      const { error } = await supabase.from("consultoria_slots").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consultoria_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    slots: query.data || [],
    isLoading: query.isLoading,
    addSlot,
    updateSlot,
    deleteSlot,
  };
}

export const TURNO_LABEL: Record<"manha" | "tarde", string> = {
  manha: "Manhã",
  tarde: "Tarde",
};

export const DIAS_SEMANA_CONS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];