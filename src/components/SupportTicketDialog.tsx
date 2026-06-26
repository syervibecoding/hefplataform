import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Star } from "lucide-react";
import { useTicketMessages, useSupportMutations, useTicketAttachments, getAttachmentSignedUrl, STATUS_META, CATEGORIA_META, PRIORIDADE_META, type SupportTicket, type TicketStatus, type TicketCategoria, type TicketPrioridade, type SupportAttachment } from "@/hooks/useSupport";
import SupportAttachmentList, { AttachmentDropzone, fileToBase64 } from "@/components/SupportAttachmentList";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

interface Props {
  ticket: SupportTicket | null;
  onClose: () => void;
  clientName?: string;
}

export default function SupportTicketDialog({ ticket, onClose, clientName }: Props) {
  const { data: messages = [] } = useTicketMessages(ticket?.id);
  const { data: attachments = [] } = useTicketAttachments(ticket?.id);
  const { updateTicket, addTeamMessage } = useSupportMutations();
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const qc = useQueryClient();

  useEffect(() => { setReply(""); setFiles([]); }, [ticket?.id]);

  if (!ticket) return null;
  const statusMeta = STATUS_META[ticket.status];

  const ticketInitialAtts = useMemo(() => attachments.filter((a) => a.message_id === null), [attachments]);
  const attsByMessage = useMemo(() => {
    const map: Record<string, SupportAttachment[]> = {};
    for (const a of attachments) if (a.message_id) (map[a.message_id] ??= []).push(a);
    return map;
  }, [attachments]);

  const resolveUrl = (att: SupportAttachment) => getAttachmentSignedUrl(att.file_path);

  const uploadTeamAttachments = async (ticketId: string, messageId: string | null) => {
    for (const f of files) {
      try {
        const file_base64 = await fileToBase64(f);
        const path = `tickets/${ticketId}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120)}`;
        const bytes = Uint8Array.from(atob(file_base64), (c) => c.charCodeAt(0));
        const { error: upErr } = await supabase.storage.from("support-attachments").upload(path, bytes, { contentType: f.type || "application/octet-stream", upsert: false });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("support_attachments" as any).insert({
          ticket_id: ticketId,
          message_id: messageId,
          file_path: path,
          file_name: f.name,
          mime_type: f.type || "application/octet-stream",
          size_bytes: f.size,
          uploaded_by_type: "equipe",
        });
        if (insErr) throw insErr;
      } catch (e: any) {
        // continue with others
        console.error("upload error", e);
      }
    }
    qc.invalidateQueries({ queryKey: ["support_attachments", ticketId] });
  };

  const sendReply = () => {
    const body = reply.trim();
    if (!body && files.length === 0) return;
    addTeamMessage.mutate(
      { ticket_id: ticket.id, body: body || "(anexos enviados)" },
      {
        onSuccess: async (msg: any) => {
          setReply("");
          if (files.length) {
            await uploadTeamAttachments(ticket.id, msg?.id ?? null);
            setFiles([]);
          }
        },
      }
    );
  };

  return (
    <Dialog open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{ticket.titulo}</DialogTitle>
          {clientName && <p className="text-xs text-muted-foreground">{clientName}</p>}
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={ticket.status} onValueChange={(v) => updateTicket.mutate({ id: ticket.id, patch: { status: v as TicketStatus } })}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_META) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Categoria</label>
              <Select value={ticket.categoria} onValueChange={(v) => updateTicket.mutate({ id: ticket.id, patch: { categoria: v as TicketCategoria } })}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_META) as TicketCategoria[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORIA_META[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prioridade</label>
              <Select value={ticket.prioridade} onValueChange={(v) => updateTicket.mutate({ id: ticket.id, patch: { prioridade: v as TicketPrioridade } })}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORIDADE_META) as TicketPrioridade[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORIDADE_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-secondary/40 border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-[10px]">{ticket.submitted_by_name ?? "Cliente"}</Badge>
              <span className="text-[10px] text-muted-foreground">{format(new Date(ticket.opened_at), "dd/MM HH:mm", { locale: ptBR })}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{ticket.descricao}</p>
            <SupportAttachmentList attachments={ticketInitialAtts} resolveUrl={resolveUrl} />
          </div>

          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`p-3 rounded-lg border ${m.author_type === "equipe" ? "bg-primary/5 border-primary/20 ml-6" : "bg-secondary/40 border-border mr-6"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={m.author_type === "equipe" ? "default" : "outline"} className="text-[10px]">
                    {m.author_type === "equipe" ? "Equipe" : (m.author_name ?? "Cliente")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                <SupportAttachmentList attachments={attsByMessage[m.id] ?? []} resolveUrl={resolveUrl} />
              </div>
            ))}
          </div>

          {ticket.csat_rating && (
            <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < (ticket.csat_rating ?? 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"} />
                ))}
                <span className="text-xs font-medium ml-2">Avaliação do cliente</span>
              </div>
              {ticket.csat_comment && <p className="text-xs text-muted-foreground">{ticket.csat_comment}</p>}
            </div>
          )}

          {ticket.status !== "fechado" && (
            <div>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Responder ao cliente..."
                rows={3}
                className="bg-secondary border-border resize-none text-sm"
              />
              <div className="mt-2">
                <AttachmentDropzone files={files} setFiles={setFiles} />
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={sendReply} disabled={(!reply.trim() && files.length === 0) || addTeamMessage.isPending} className="gap-1.5">
                  <Send size={13} /> Enviar
                </Button>
              </div>
            </div>
          )}

          <div className={`text-[11px] px-2 py-1 rounded inline-block border ${statusMeta.cls}`}>{statusMeta.label}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}