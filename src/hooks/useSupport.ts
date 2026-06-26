import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TicketStatus = "aberto" | "em_andamento" | "aguardando_cliente" | "resolvido" | "fechado";
export type TicketCategoria = "bug" | "ajuste" | "duvida" | "feature" | "outro";
export type TicketPrioridade = "baixa" | "normal" | "alta" | "urgente";

export interface SupportTicket {
  id: string;
  client_id: string;
  product_id: string | null;
  titulo: string;
  descricao: string;
  categoria: TicketCategoria;
  prioridade: TicketPrioridade;
  status: TicketStatus;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  csat_rating: number | null;
  csat_comment: string | null;
  opened_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_type: "cliente" | "equipe";
  author_name: string | null;
  body: string;
  created_at: string;
}

export interface SupportAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by_type: "cliente" | "equipe";
  uploaded_by_name: string | null;
  created_at: string;
}

export function useTicketAttachments(ticketId?: string) {
  return useQuery({
    queryKey: ["support_attachments", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<SupportAttachment[]> => {
      const { data, error } = await supabase
        .from("support_attachments" as any)
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at");
      if (error) throw error;
      return ((data ?? []) as unknown) as SupportAttachment[];
    },
  });
}

export async function getAttachmentSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("support-attachments").createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export function useSupportTickets(clientId?: string) {
  return useQuery({
    queryKey: ["support_tickets", clientId ?? "all"],
    queryFn: async (): Promise<SupportTicket[]> => {
      let q = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });
}

export function useTicketMessages(ticketId?: string) {
  return useQuery({
    queryKey: ["support_ticket_messages", ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<TicketMessage[]> => {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as TicketMessage[];
    },
  });
}

export function useSupportMutations() {
  const qc = useQueryClient();

  const updateTicket = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SupportTicket> }) => {
      const now = new Date().toISOString();
      const finalPatch: any = { ...patch };
      if (patch.status === "resolvido" && !patch.resolved_at) finalPatch.resolved_at = now;
      if (patch.status === "fechado" && !patch.closed_at) finalPatch.closed_at = now;
      const { data, error } = await supabase.from("support_tickets").update(finalPatch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support_tickets"] });
      toast.success("Ticket atualizado");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao atualizar"),
  });

  const addTeamMessage = useMutation({
    mutationFn: async ({ ticket_id, body, author_name }: { ticket_id: string; body: string; author_name?: string }) => {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .insert({ ticket_id, body, author_name: author_name ?? null, author_type: "equipe" })
        .select()
        .single();
      if (error) throw error;
      // first response timestamp
      const { data: t } = await supabase.from("support_tickets").select("first_response_at, status").eq("id", ticket_id).maybeSingle();
      const patch: any = {};
      if (t && !t.first_response_at) patch.first_response_at = new Date().toISOString();
      if (t && t.status === "aberto") patch.status = "em_andamento";
      if (Object.keys(patch).length) await supabase.from("support_tickets").update(patch).eq("id", ticket_id);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["support_ticket_messages", vars.ticket_id] });
      qc.invalidateQueries({ queryKey: ["support_tickets"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao enviar"),
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support_tickets"] });
      toast.success("Ticket removido");
    },
  });

  return { updateTicket, addTeamMessage, deleteTicket };
}

export function useClientSupportSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, support_enabled }: { id: string; support_enabled: boolean }) => {
      const { data, error } = await supabase.from("clients").update({ support_enabled }).eq("id", id).select("id, support_slug, support_enabled").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_clients"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client_support"] });
      toast.success("Configuração de suporte salva");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });
}

export function useClientSupport(clientId?: string) {
  return useQuery({
    queryKey: ["client_support", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, nome, support_slug, support_enabled, product_id").eq("id", clientId!).single();
      if (error) throw error;
      return data as { id: string; nome: string; support_slug: string | null; support_enabled: boolean; product_id: string };
    },
  });
}

// metrics helpers
export interface TicketMetrics {
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  csatAvg: number | null;
  csatCount: number;
  byCategoria: Record<string, number>;
  byClient: Array<{ client_id: string; count: number }>;
  byProduct: Array<{ product_id: string; count: number }>;
  byStatus: Record<TicketStatus, number>;
  total: number;
}

export function computeMetrics(tickets: SupportTicket[]): TicketMetrics {
  const hrs = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;
  const firstResp = tickets.filter((t) => t.first_response_at).map((t) => hrs(t.opened_at, t.first_response_at!));
  const resol = tickets.filter((t) => t.resolved_at).map((t) => hrs(t.opened_at, t.resolved_at!));
  const ratings = tickets.filter((t) => t.csat_rating).map((t) => t.csat_rating!);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const byCat: Record<string, number> = {};
  const byClient: Record<string, number> = {};
  const byProduct: Record<string, number> = {};
  const byStatus: Record<TicketStatus, number> = { aberto: 0, em_andamento: 0, aguardando_cliente: 0, resolvido: 0, fechado: 0 };
  for (const t of tickets) {
    byCat[t.categoria] = (byCat[t.categoria] ?? 0) + 1;
    byClient[t.client_id] = (byClient[t.client_id] ?? 0) + 1;
    if (t.product_id) byProduct[t.product_id] = (byProduct[t.product_id] ?? 0) + 1;
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  }
  return {
    avgFirstResponseHours: avg(firstResp),
    avgResolutionHours: avg(resol),
    csatAvg: avg(ratings),
    csatCount: ratings.length,
    byCategoria: byCat,
    byClient: Object.entries(byClient).map(([client_id, count]) => ({ client_id, count })).sort((a, b) => b.count - a.count),
    byProduct: Object.entries(byProduct).map(([product_id, count]) => ({ product_id, count })).sort((a, b) => b.count - a.count),
    byStatus,
    total: tickets.length,
  };
}

export const STATUS_META: Record<TicketStatus, { label: string; cls: string }> = {
  aberto: { label: "Aberto", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  em_andamento: { label: "Em andamento", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  aguardando_cliente: { label: "Aguardando cliente", cls: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  resolvido: { label: "Resolvido", cls: "bg-green-500/10 text-green-600 border-green-500/20" },
  fechado: { label: "Fechado", cls: "bg-muted text-muted-foreground border-border" },
};

export const CATEGORIA_META: Record<TicketCategoria, { label: string }> = {
  bug: { label: "Bug" },
  ajuste: { label: "Ajuste" },
  duvida: { label: "Dúvida" },
  feature: { label: "Nova feature" },
  outro: { label: "Outro" },
};

export const PRIORIDADE_META: Record<TicketPrioridade, { label: string; cls: string }> = {
  baixa: { label: "Baixa", cls: "text-muted-foreground" },
  normal: { label: "Normal", cls: "text-foreground" },
  alta: { label: "Alta", cls: "text-amber-600" },
  urgente: { label: "Urgente", cls: "text-red-600" },
};