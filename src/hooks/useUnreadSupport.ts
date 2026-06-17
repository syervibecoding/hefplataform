import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Realtime subscription for support_tickets + support_ticket_messages.
 * Invalidates the relevant queries whenever rows change.
 * Mount ONCE per role context (internal vs cliente).
 */
export function useSupportRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("support-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        qc.invalidateQueries({ queryKey: ["support_tickets"] });
        qc.invalidateQueries({ queryKey: ["portal_tickets"] });
        qc.invalidateQueries({ queryKey: ["unread_support"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_ticket_messages" }, (payload: any) => {
        const ticketId = payload?.new?.ticket_id ?? payload?.old?.ticket_id;
        if (ticketId) {
          qc.invalidateQueries({ queryKey: ["support_ticket_messages", ticketId] });
          qc.invalidateQueries({ queryKey: ["portal_ticket_msgs", ticketId] });
        }
        qc.invalidateQueries({ queryKey: ["support_tickets"] });
        qc.invalidateQueries({ queryKey: ["portal_tickets"] });
        qc.invalidateQueries({ queryKey: ["unread_support"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

interface UnreadRow {
  ticket_id: string;
  count: number;
}

/**
 * Unread counts.
 * For the internal team: messages from "cliente" newer than ticket.last_team_read_at.
 * For the cliente: messages from "equipe" newer than ticket.last_client_read_at.
 */
export function useUnreadSupport() {
  const { user, isCliente, platformCompanyId } = useAuth();

  return useQuery({
    queryKey: ["unread_support", isCliente ? `cli:${platformCompanyId}` : `team:${user?.id ?? "anon"}`],
    enabled: !!user,
    queryFn: async (): Promise<{ total: number; perTicket: Record<string, number> }> => {
      const sideAuthor = isCliente ? "equipe" : "cliente";
      const readCol = isCliente ? "last_client_read_at" : "last_team_read_at";

      let tQ = supabase.from("support_tickets").select(`id, ${readCol}`);
      if (isCliente && platformCompanyId) tQ = tQ.eq("platform_company_id", platformCompanyId);
      const { data: tickets, error: tErr } = await tQ;
      if (tErr) throw tErr;

      const ids = (tickets ?? []).map((t: any) => t.id);
      if (ids.length === 0) return { total: 0, perTicket: {} };

      const { data: msgs, error: mErr } = await supabase
        .from("support_ticket_messages")
        .select("ticket_id, author_type, created_at")
        .in("ticket_id", ids)
        .eq("author_type", sideAuthor);
      if (mErr) throw mErr;

      const readMap = Object.fromEntries(
        (tickets ?? []).map((t: any) => [t.id, t[readCol] ? new Date(t[readCol]).getTime() : 0])
      );
      const perTicket: Record<string, number> = {};
      for (const m of msgs ?? []) {
        const since = readMap[m.ticket_id] ?? 0;
        if (new Date(m.created_at).getTime() > since) {
          perTicket[m.ticket_id] = (perTicket[m.ticket_id] ?? 0) + 1;
        }
      }
      const total = Object.values(perTicket).reduce((a, b) => a + b, 0);
      return { total, perTicket };
    },
  });
}

/**
 * Mark a single ticket as read for the current side (team or cliente).
 */
export async function markTicketRead(ticketId: string, side: "team" | "cliente") {
  const patch =
    side === "cliente"
      ? { last_client_read_at: new Date().toISOString() }
      : { last_team_read_at: new Date().toISOString() };
  await supabase.from("support_tickets").update(patch).eq("id", ticketId);
}

export function useUnreadTotal() {
  const { data } = useUnreadSupport();
  return useMemo(() => data?.total ?? 0, [data]);
}