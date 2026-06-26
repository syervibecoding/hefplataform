import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { LifeBuoy, Send, Plus, Star, Loader2, RotateCcw, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { STATUS_META, CATEGORIA_META, type SupportTicket, type TicketCategoria, type TicketMessage, type TicketPrioridade, type SupportAttachment } from "@/hooks/useSupport";
import SupportAttachmentList, { AttachmentDropzone, fileToBase64 } from "@/components/SupportAttachmentList";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${FN_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${ANON}`, ...(init.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Erro");
  return json;
}

const PORTAL_PRIORIDADES: { value: TicketPrioridade; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta — está travando meu trabalho" },
  { value: "urgente", label: "Urgente — sistema fora do ar" },
];

const lastReadKey = (id: string) => `hef:portal-read:${id}`;
const getLastRead = (id: string) => Number(localStorage.getItem(lastReadKey(id)) ?? 0);
const setLastRead = (id: string) => localStorage.setItem(lastReadKey(id), String(Date.now()));

async function uploadAttachments(slug: string, ticket_id: string, message_id: string | null, files: File[], author?: string) {
  for (const file of files) {
    try {
      const file_base64 = await fileToBase64(file);
      await call("/portal-upload-attachment", {
        method: "POST",
        body: JSON.stringify({
          slug, ticket_id, message_id,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          file_base64,
          uploaded_by_name: author,
        }),
      });
    } catch (e: any) {
      toast.error(`Falha ao enviar ${file.name}: ${e.message}`);
    }
  }
}

interface PortalData {
  client: { id: string; nome: string };
  products: { id: string; nome: string }[];
  tickets: SupportTicket[];
  messages: TicketMessage[];
  attachments: SupportAttachment[];
}

export default function PublicSupportPortal() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = async () => {
    if (!slug) return;
    try {
      const json = await call(`/portal-get-tickets?slug=${encodeURIComponent(slug)}`);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );
  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LifeBuoy size={32} className="mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Portal indisponível.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <LifeBuoy size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Portal de Suporte</p>
              <h1 className="text-lg font-bold">{data.client.nome}</h1>
            </div>
          </div>
          <NewTicketDialog slug={slug!} open={newOpen} setOpen={setNewOpen} onCreated={load} products={data.products} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        {data.tickets.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <LifeBuoy size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum chamado ainda. Abra o primeiro para receber suporte da equipe.</p>
          </div>
        ) : (
          data.tickets.map((t) => {
            const meta = STATUS_META[t.status];
            const teamMsgs = data.messages.filter((m) => m.ticket_id === t.id && m.author_type === "equipe");
            const lastTeamAt = teamMsgs.length ? new Date(teamMsgs[teamMsgs.length - 1].created_at).getTime() : 0;
            const unread = lastTeamAt > getLastRead(t.id);
            const ticketAtts = data.attachments.filter((a) => a.ticket_id === t.id);
            return (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setLastRead(t.id); }}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{t.titulo}</p>
                      {unread && <span className="h-2 w-2 rounded-full bg-red-500" title="Equipe respondeu" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.descricao}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{CATEGORIA_META[t.categoria].label}</Badge>
                      {ticketAtts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Paperclip size={10} />{ticketAtts.length}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{format(new Date(t.opened_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.cls}`}>{meta.label}</Badge>
                </div>
              </button>
            );
          })
        )}
      </main>

      {selected && (
        <TicketThreadDialog
          ticket={selected}
          slug={slug!}
          messages={data.messages.filter((m) => m.ticket_id === selected.id)}
          attachments={data.attachments.filter((a) => a.ticket_id === selected.id)}
          onClose={() => setSelected(null)}
          onChange={load}
        />
      )}
    </div>
  );
}

function NewTicketDialog({ slug, open, setOpen, onCreated, products }: { slug: string; open: boolean; setOpen: (v: boolean) => void; onCreated: () => void; products: { id: string; nome: string }[] }) {
  const [form, setForm] = useState({
    titulo: "", descricao: "",
    categoria: "duvida" as TicketCategoria,
    prioridade: "normal" as TicketPrioridade,
    product_id: "" as string,
    submitted_by_name: "", submitted_by_email: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (form.titulo.trim().length < 3 || form.descricao.trim().length < 3) {
      toast.error("Preencha título e descrição");
      return;
    }
    if (form.submitted_by_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitted_by_email)) {
      toast.error("E-mail inválido");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        slug,
        titulo: form.titulo,
        descricao: form.descricao,
        categoria: form.categoria,
        prioridade: form.prioridade,
        product_id: form.product_id || null,
        submitted_by_name: form.submitted_by_name,
        submitted_by_email: form.submitted_by_email || null,
      };
      const res = await call("/portal-create-ticket", { method: "POST", body: JSON.stringify(payload) });
      const newTicketId = res?.ticket?.id;
      if (newTicketId && files.length) {
        await uploadAttachments(slug, newTicketId, null, files, form.submitted_by_name);
      }
      toast.success("Chamado aberto — equipe avisada");
      setForm({ titulo: "", descricao: "", categoria: "duvida", prioridade: "normal", product_id: "", submitted_by_name: "", submitted_by_email: "" });
      setFiles([]);
      setOpen(false);
      onCreated();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus size={14} /> Abrir chamado</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-base">Abrir novo chamado</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Seu nome</Label>
              <Input value={form.submitted_by_name} onChange={(e) => setForm({ ...form, submitted_by_name: e.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs">E-mail (opcional)</Label>
              <Input value={form.submitted_by_email} onChange={(e) => setForm({ ...form, submitted_by_email: e.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="mt-1 bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v as TicketCategoria })}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIA_META) as TicketCategoria[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORIA_META[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as TicketPrioridade })}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PORTAL_PRIORIDADES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {products.length > 0 && (
            <div>
              <Label className="text-xs">Plataforma relacionada (opcional)</Label>
              <Select value={form.product_id || "__none"} onValueChange={(v) => setForm({ ...form, product_id: v === "__none" ? "" : v })}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Nenhuma / não sei</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Descrição *</Label>
            <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={4} className="mt-1 bg-secondary border-border resize-none text-sm" />
          </div>
          <AttachmentDropzone files={files} setFiles={setFiles} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={submitting}>{submitting ? "Enviando..." : "Abrir chamado"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketThreadDialog({ ticket, slug, messages, attachments, onClose, onChange }: { ticket: SupportTicket; slug: string; messages: TicketMessage[]; attachments: SupportAttachment[]; onClose: () => void; onChange: () => void }) {
  const [reply, setReply] = useState("");
  const [authorName, setAuthorName] = useState(ticket.submitted_by_name ?? "");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenMotivo, setReopenMotivo] = useState("");

  const meta = STATUS_META[ticket.status];

  const resolveUrl = async (att: SupportAttachment) => {
    const r = await call(`/portal-get-attachment?slug=${encodeURIComponent(slug)}&id=${att.id}`);
    return r.url as string;
  };

  const ticketInitialAtts = useMemo(() => attachments.filter((a) => a.message_id === null), [attachments]);
  const attsByMessage = useMemo(() => {
    const map: Record<string, SupportAttachment[]> = {};
    for (const a of attachments) if (a.message_id) (map[a.message_id] ??= []).push(a);
    return map;
  }, [attachments]);

  const send = async () => {
    if (!reply.trim() && files.length === 0) return;
    setSending(true);
    try {
      const body = reply.trim() || "(anexos enviados)";
      const res = await call("/portal-add-message", { method: "POST", body: JSON.stringify({ slug, ticket_id: ticket.id, body, author_name: authorName }) });
      const msgId = res?.message?.id ?? null;
      if (files.length) await uploadAttachments(slug, ticket.id, msgId, files, authorName);
      setReply("");
      setFiles([]);
      onChange();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const reopen = async () => {
    if (reopenMotivo.trim().length < 3) { toast.error("Descreva o motivo"); return; }
    setSending(true);
    try {
      await call("/portal-reopen-ticket", { method: "POST", body: JSON.stringify({ slug, ticket_id: ticket.id, motivo: reopenMotivo, author_name: authorName }) });
      toast.success("Chamado reaberto");
      setReopenOpen(false);
      setReopenMotivo("");
      onChange();
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  const rate = async () => {
    if (rating < 1) { toast.error("Escolha uma nota"); return; }
    setSending(true);
    try {
      await call("/portal-rate-ticket", { method: "POST", body: JSON.stringify({ slug, ticket_id: ticket.id, rating, comment }) });
      toast.success("Obrigado pela avaliação!");
      onChange();
      onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{ticket.titulo}</DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>
            <Badge variant="outline" className="text-[10px]">{CATEGORIA_META[ticket.categoria].label}</Badge>
          </div>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary/40 border border-border">
            <p className="text-[10px] text-muted-foreground mb-1">{ticket.submitted_by_name ?? "Você"} · {format(new Date(ticket.opened_at), "dd/MM HH:mm", { locale: ptBR })}</p>
            <p className="text-sm whitespace-pre-wrap">{ticket.descricao}</p>
            <SupportAttachmentList attachments={ticketInitialAtts} resolveUrl={resolveUrl} />
          </div>
          {messages.map((m) => (
            <div key={m.id} className={`p-3 rounded-lg border ${m.author_type === "equipe" ? "bg-primary/5 border-primary/20" : "bg-secondary/40 border-border"}`}>
              <p className="text-[10px] text-muted-foreground mb-1">
                {m.author_type === "equipe" ? "Equipe de suporte" : (m.author_name ?? "Você")} · {format(new Date(m.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </p>
              <p className="text-sm whitespace-pre-wrap">{m.body}</p>
              <SupportAttachmentList attachments={attsByMessage[m.id] ?? []} resolveUrl={resolveUrl} />
            </div>
          ))}

          {ticket.status === "resolvido" && !ticket.csat_rating && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
              <p className="text-sm font-semibold">Como foi o atendimento?</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star size={22} className={n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"} />
                  </button>
                ))}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário (opcional)" rows={2} className="bg-secondary border-border resize-none text-sm" />
              <Button size="sm" onClick={rate} disabled={sending}>Enviar avaliação</Button>
            </div>
          )}

          {ticket.status !== "fechado" && ticket.status !== "resolvido" && (
            <div className="space-y-2">
              <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Seu nome" className="bg-secondary border-border h-8 text-xs" />
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Responder..." rows={3} className="bg-secondary border-border resize-none text-sm" />
              <AttachmentDropzone files={files} setFiles={setFiles} />
              <div className="flex justify-end">
                <Button size="sm" onClick={send} disabled={(!reply.trim() && files.length === 0) || sending} className="gap-1.5"><Send size={13} /> Enviar</Button>
              </div>
            </div>
          )}

          {(ticket.status === "fechado" || ticket.status === "resolvido") && (
            <div className="pt-2 border-t border-border">
              {!reopenOpen ? (
                <Button variant="outline" size="sm" onClick={() => setReopenOpen(true)} className="gap-1.5">
                  <RotateCcw size={13} /> Reabrir chamado
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Por que está reabrindo?</Label>
                  <Textarea value={reopenMotivo} onChange={(e) => setReopenMotivo(e.target.value)} rows={3} className="bg-secondary border-border resize-none text-sm" />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setReopenOpen(false)}>Cancelar</Button>
                    <Button size="sm" onClick={reopen} disabled={sending}>Reabrir</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}