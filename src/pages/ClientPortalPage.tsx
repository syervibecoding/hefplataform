import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Plus, LayoutGrid, MessageSquare, Send, Loader2, Building2, CheckCircle2, Clock, Circle } from "lucide-react";
import { toast } from "sonner";
import { useSupportRealtime, useUnreadSupport, markTicketRead } from "@/hooks/useUnreadSupport";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoHef from "@/assets/logo-hefsys.png";

// 3-status visual model for the client view
type ClientStatus = "aberto" | "em_andamento" | "resolvido";
const STATUS_CLIENT: Record<ClientStatus, { label: string; cls: string; icon: any }> = {
  aberto: { label: "Aberto", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Circle },
  em_andamento: { label: "Em andamento", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  resolvido: { label: "Resolvido", cls: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
};
function mapStatus(s: string): ClientStatus {
  if (s === "resolvido" || s === "fechado") return "resolvido";
  if (s === "em_andamento" || s === "aguardando_cliente") return "em_andamento";
  return "aberto";
}

const CATEGORIAS = [
  { value: "melhoria", label: "Melhoria" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "alteracao", label: "Alteração" },
] as const;
type Categoria = (typeof CATEGORIAS)[number]["value"];

interface Ticket {
  id: string;
  client_id: string | null;
  platform_company_id: string | null;
  product_id: string | null;
  titulo: string;
  descricao: string;
  categoria: string;
  status: string;
  opened_at: string;
  updated_at: string;
}
interface Msg {
  id: string;
  ticket_id: string;
  author_type: "cliente" | "equipe";
  author_name: string | null;
  body: string;
  created_at: string;
}

export default function ClientPortalPage() {
  const { profile, platformCompanyId, signOut } = useAuth();
  useSupportRealtime();
  const { data: unread } = useUnreadSupport();

  const { data: company } = useQuery({
    queryKey: ["portal_company", platformCompanyId],
    enabled: !!platformCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_companies").select("id, nome").eq("id", platformCompanyId!).maybeSingle();
      if (error) throw error;
      return data as { id: string; nome: string } | null;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["portal_products", platformCompanyId],
    enabled: !!platformCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lovable_products").select("id, nome, descricao, url_app").order("nome");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; nome: string; descricao: string | null; url_app: string | null }>;
    },
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["portal_tickets", platformCompanyId],
    enabled: !!platformCompanyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets").select("*").order("opened_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
  });

  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.nome])), [products]);

  const [openNew, setOpenNew] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const openTicket = (t: Ticket) => {
    setSelected(t);
    markTicketRead(t.id, "cliente");
  };

  if (!platformCompanyId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-3">
          <p className="text-sm">Sua conta ainda não está associada a uma empresa. Fale com a equipe.</p>
          <Button variant="outline" onClick={() => signOut()} className="gap-2"><LogOut size={14} /> Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoHef} alt="HefSys" className="h-9 w-auto" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{client?.nome ?? "Portal do cliente"}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {profile?.display_name || profile?.username}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-1.5">
            <LogOut size={14} /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid size={16} className="text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Suas plataformas</h2>
          </div>
          {products.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground text-center">
              Nenhuma plataforma liberada ainda.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-primary" />
                    <p className="text-sm font-semibold truncate">{p.nome}</p>
                  </div>
                  {p.descricao && <p className="text-[11px] text-muted-foreground line-clamp-2">{p.descricao}</p>}
                  {p.url_app && (
                    <a href={p.url_app} target="_blank" rel="noreferrer"
                       className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                      Acessar →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Suas conversas</h2>
            </div>
            <Button size="sm" onClick={() => setOpenNew(true)} disabled={products.length === 0} className="gap-1.5">
              <Plus size={14} /> Novo pedido
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Você ainda não abriu nenhum pedido.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {tickets.map((t) => {
                  const cs = mapStatus(t.status);
                  const meta = STATUS_CLIENT[cs];
                  const Icon = meta.icon;
                  const u = unread?.perTicket[t.id] ?? 0;
                  return (
                    <button key={t.id} onClick={() => openTicket(t)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{t.titulo}</p>
                          {u > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {u > 9 ? "9+" : u}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.product_id ? productMap[t.product_id] ?? "—" : "—"} ·{" "}
                          {format(new Date(t.opened_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
                        <Icon size={11} /> {meta.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <NewTicketDialog
        open={openNew}
        onClose={() => setOpenNew(false)}
        clientId={clientId}
        products={products}
      />
      <TicketDetailDialog
        ticket={selected}
        productName={selected?.product_id ? productMap[selected.product_id] : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function NewTicketDialog({
  open, onClose, clientId, products,
}: {
  open: boolean; onClose: () => void; clientId: string;
  products: Array<{ id: string; nome: string }>;
}) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [productId, setProductId] = useState<string>("");
  const [categoria, setCategoria] = useState<Categoria>("melhoria");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_tickets").insert({
        client_id: clientId,
        product_id: productId || null,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoria,
        prioridade: "normal",
        status: "aberto",
        submitted_by_name: profile?.display_name || profile?.username || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portal_tickets"] });
      toast.success("Pedido enviado");
      setTitulo(""); setDescricao(""); setProductId(""); setCategoria("melhoria");
      onClose();
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao enviar"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Novo pedido</DialogTitle>
          <DialogDescription>Abra uma melhoria, reclamação ou alteração para uma plataforma liberada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Plataforma</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
              <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)}
                   placeholder="Resumo curto do pedido" className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                      rows={5} placeholder="Descreva com detalhes..." className="mt-1 bg-secondary border-border" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={() => create.mutate()}
                    disabled={!productId || !titulo.trim() || !descricao.trim() || create.isPending}
                    className="gap-1.5">
              {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketDetailDialog({
  ticket, productName, onClose,
}: { ticket: Ticket | null; productName?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [body, setBody] = useState("");

  const { data: msgs = [] } = useQuery({
    queryKey: ["portal_ticket_msgs", ticket?.id],
    enabled: !!ticket,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_ticket_messages").select("*")
        .eq("ticket_id", ticket!.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!ticket) return;
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        author_type: "cliente",
        author_name: profile?.display_name || profile?.username || null,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["portal_ticket_msgs", ticket?.id] });
      qc.invalidateQueries({ queryKey: ["portal_tickets"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao enviar"),
  });

  if (!ticket) return null;
  const cs = mapStatus(ticket.status);
  const meta = STATUS_CLIENT[cs];
  const Icon = meta.icon;

  return (
    <Dialog open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">{ticket.titulo}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            {productName && <span className="text-xs">{productName}</span>}
            <Badge variant="outline" className={`text-[10px] gap-1 ${meta.cls}`}>
              <Icon size={11} /> {meta.label}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="bg-secondary/50 rounded-md p-3 text-sm whitespace-pre-wrap">{ticket.descricao}</div>
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.author_type === "cliente" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.author_type === "cliente" ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}>
                <p className="text-[10px] opacity-70 mb-0.5">
                  {m.author_name || (m.author_type === "cliente" ? "Você" : "Equipe")} ·{" "}
                  {format(new Date(m.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          ))}
        </div>

        {cs !== "resolvido" && (
          <div className="border-t border-border pt-3 space-y-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2}
                      placeholder="Escreva uma resposta..." className="bg-secondary border-border" />
            <div className="flex justify-end">
              <Button size="sm" onClick={() => send.mutate()} disabled={!body.trim() || send.isPending}
                      className="gap-1.5">
                {send.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}