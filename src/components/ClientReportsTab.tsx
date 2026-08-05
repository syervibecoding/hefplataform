import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Package, LifeBuoy, CalendarDays, Search, CheckCircle2, Clock, FileDown, Pencil, Eye, EyeOff, Plus, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateClientReportPdf } from "@/lib/clientReportPdf";
import { toast } from "sonner";
import { useClientReport } from "@/hooks/useClientReport";
import { useAllClients } from "@/hooks/useAllClients";
import { useLovableProducts } from "@/hooks/useLovableProducts";
import { useSupportTickets, STATUS_META, CATEGORIA_META, type SupportTicket } from "@/hooks/useSupport";
import type { Interaction } from "@/hooks/useClientInteractions";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function useAllInteractions() {
  return useQuery({
    queryKey: ["all_client_interactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_interactions")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return (data || []) as Interaction[];
    },
  });
}

export default function ClientReportsTab() {
  const { data: clients = [] } = useAllClients();
  const { products, links } = useLovableProducts();
  const { data: tickets = [] } = useSupportTickets();
  const { data: interactions = [] } = useAllInteractions();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return clients
      .map((c) => {
        const plats = links
          .filter((l) => l.client_id === c.id)
          .map((l) => ({ link: l, product: products.find((p) => p.id === l.product_id) }))
          .filter((x) => x.product);
        const tk = tickets.filter((t) => t.client_id === c.id);
        const inter = interactions.filter((i) => i.client_id === c.id);
        const inicio = c.data_inicio || c.data_kickoff || c.created_at?.slice(0, 10) || null;
        return { client: c, plats, tickets: tk, interactions: inter, inicio };
      })
      .filter((r) => r.plats.length > 0 || r.tickets.length > 0 || r.interactions.length > 0)
      .sort((a, b) => b.plats.length - a.plats.length || a.client.nome.localeCompare(b.client.nome));
  }, [clients, links, products, tickets, interactions]);

  const filtered = rows.filter((r) => r.client.nome.toLowerCase().includes(search.toLowerCase()));
  const selected = filtered.find((r) => r.client.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Lista de clientes */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border text-sm"
          />
        </div>
        <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden max-h-[520px] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">Nenhum cliente com histórico.</p>
          )}
          {filtered.map((r) => {
            const active = selected?.client.id === r.client.id;
            return (
              <button
                key={r.client.id}
                onClick={() => setSelectedId(r.client.id)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  active ? "bg-primary/10" : "hover:bg-secondary/50"
                }`}
              >
                <p className={`text-sm font-medium truncate ${active ? "text-primary" : ""}`}>{r.client.nome}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.plats.length} plataformas · {r.tickets.length} chamados
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Relatório */}
      {selected ? (
        <ClientReport data={selected} />
      ) : (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          Selecione um cliente.
        </div>
      )}
    </div>
  );
}

function ClientReport({
  data,
}: {
  data: {
    client: any;
    plats: { link: any; product: any }[];
    tickets: SupportTicket[];
    interactions: Interaction[];
    inicio: string | null;
  };
}) {
  const { client, plats, tickets, interactions, inicio } = data;
  const { settings, items, saveSettings, saveItem, deleteItem } = useClientReport(client.id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    subtitulo: "",
    data_referencia: "",
    periodo_inicio: "",
    periodo_fim: "",
    introducao: "",
    conclusao: "",
  });
  const [newItem, setNewItem] = useState({ titulo: "", data: "", descricao: "" });

  useEffect(() => {
    setForm({
      titulo: settings?.titulo ?? "",
      subtitulo: settings?.subtitulo ?? "",
      data_referencia: settings?.data_referencia ?? "",
      periodo_inicio: settings?.periodo_inicio ?? "",
      periodo_fim: settings?.periodo_fim ?? "",
      introducao: settings?.introducao ?? "",
      conclusao: settings?.conclusao ?? "",
    });
  }, [settings, client.id]);

  const overrides = useMemo(
    () => Object.fromEntries(items.map((i) => [i.item_key, i])),
    [items]
  );

  const meses = inicio ? Math.max(1, differenceInMonths(new Date(), parseISO(inicio)) + 1) : null;
  const resolvidos = tickets.filter((t) => t.resolved_at || t.status === "fechado").length;
  const valorMensal = client.faturamento ?? client.valor_contrato ?? client.valor_mensalidade ?? 0;

  const timelineAll = useMemo(() => {
    const base: { key: string; date: string; kind: string; title: string; sub?: string }[] = [];
    if (inicio) base.push({ key: "inicio", date: inicio, kind: "inicio", title: "Início do contrato" });
    if (client.data_golive)
      base.push({ key: "golive", date: client.data_golive, kind: "inicio", title: "Go-live" });
    plats.forEach((p) =>
      base.push({
        key: `plat:${p.product.id}`,
        date: p.link.data_replicacao || p.product.created_at.slice(0, 10),
        kind: "plataforma",
        title: `Plataforma entregue: ${p.product.nome}`,
        sub: p.product.descricao ?? undefined,
      })
    );
    tickets.forEach((t) =>
      base.push({
        key: `ticket:${t.id}`,
        date: t.opened_at.slice(0, 10),
        kind: "chamado",
        title: t.titulo,
        sub: `${CATEGORIA_META[t.categoria]?.label ?? t.categoria} · ${STATUS_META[t.status]?.label ?? t.status}`,
      })
    );
    interactions.forEach((i) =>
      base.push({ key: `inter:${i.id}`, date: i.data, kind: "interacao", title: i.titulo, sub: i.descricao ?? undefined })
    );
    items
      .filter((i) => i.manual)
      .forEach((i) =>
        base.push({
          key: i.item_key,
          date: i.data || new Date().toISOString().slice(0, 10),
          kind: "interacao",
          title: i.titulo || "Registro",
          sub: i.descricao ?? undefined,
        })
      );

    return base
      .map((it) => {
        const o = overrides[it.key];
        return {
          ...it,
          title: o?.titulo ?? it.title,
          sub: o?.descricao ?? it.sub,
          date: o?.data ?? it.date,
          hidden: o?.hidden ?? false,
          manual: o?.manual ?? false,
          overrideId: o?.id,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [client, plats, tickets, interactions, inicio, items, overrides]);

  const timeline = timelineAll.filter((t) => !t.hidden);

  const handleSaveSettings = async () => {
    try {
      await saveSettings.mutateAsync({
        titulo: form.titulo || null,
        subtitulo: form.subtitulo || null,
        data_referencia: form.data_referencia || null,
        periodo_inicio: form.periodo_inicio || null,
        periodo_fim: form.periodo_fim || null,
        introducao: form.introducao || null,
        conclusao: form.conclusao || null,
      } as any);
      toast.success("Relatório salvo");
      setEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível salvar");
    }
  };

  const exportPdf = () => {
    try {
      generateClientReportPdf({
        clientName: client.nome,
        titulo: form.titulo || null,
        subtitulo: form.subtitulo || null,
        dataReferencia: form.data_referencia || null,
        periodoInicio: form.periodo_inicio || null,
        periodoFim: form.periodo_fim || null,
        introducao: form.introducao || null,
        conclusao: form.conclusao || null,
        inicio,
        meses,
        valorMensal,
        kpis: [
          { label: "Plataformas", value: String(plats.length) },
          { label: "Chamados", value: String(tickets.length) },
          { label: "Resolvidos", value: String(resolvidos) },
          { label: "Interações", value: String(interactions.length) },
        ],
        plataformas: plats
          .filter(({ product }) => !overrides[`plat:${product.id}`]?.hidden)
          .map(({ link, product }) => ({
            nome: overrides[`plat:${product.id}`]?.titulo ?? product.nome,
            data: format(
              parseISO(
                overrides[`plat:${product.id}`]?.data ||
                  link.data_replicacao ||
                  product.created_at.slice(0, 10)
              ),
              "dd/MM/yyyy"
            ),
            url: product.url_app,
          })),
        timeline: timeline.map((t) => ({ date: t.date, kind: t.kind, title: t.title, sub: t.sub })),
      });
      toast.success("Relatório em PDF gerado");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o PDF");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold truncate">{client.nome}</h2>
            <p className="text-xs text-muted-foreground">
              {inicio ? `Cliente desde ${format(parseISO(inicio), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}` : "Sem data de início"}
              {meses ? ` · ${meses} ${meses === 1 ? "mês" : "meses"}` : ""}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {valorMensal > 0 && (
              <Badge variant="outline" className="font-mono text-[11px]">{brl(valorMensal)}/mês</Badge>
            )}
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={exportPdf}>
              <FileDown size={14} />
              Exportar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={Package} label="Plataformas" value={String(plats.length)} />
        <Kpi icon={LifeBuoy} label="Chamados" value={String(tickets.length)} />
        <Kpi icon={CheckCircle2} label="Resolvidos" value={String(resolvidos)} />
        <Kpi icon={CalendarDays} label="Interações" value={String(interactions.length)} />
      </div>

      {plats.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Plataformas entregues
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plats.map(({ link, product }) => (
              <div key={product.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <Package size={14} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{product.nome}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {link.data_replicacao
                      ? format(parseISO(link.data_replicacao), "dd/MM/yyyy")
                      : format(parseISO(product.created_at.slice(0, 10)), "dd/MM/yyyy")}
                  </p>
                </div>
                {product.url_app && (
                  <a href={product.url_app} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                    Abrir
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Linha do tempo desde o início do contrato
        </p>
        {timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem registros.</p>
        ) : (
          <div className="relative pl-4 space-y-3 max-h-[420px] overflow-y-auto">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
            {timeline.map((it, idx) => (
              <div key={idx} className="relative">
                <span
                  className={`absolute -left-4 top-1.5 w-[9px] h-[9px] rounded-full border-2 border-background ${
                    it.kind === "plataforma"
                      ? "bg-primary"
                      : it.kind === "chamado"
                      ? "bg-amber-500"
                      : it.kind === "inicio"
                      ? "bg-emerald-500"
                      : "bg-muted-foreground"
                  }`}
                />
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{it.title}</p>
                    {it.sub && <p className="text-[11px] text-muted-foreground line-clamp-2">{it.sub}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 inline-flex items-center gap-1">
                    <Clock size={10} />
                    {format(parseISO(it.date), "dd/MM/yy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={13} />
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-lg font-bold font-mono mt-1">{value}</p>
    </div>
  );
}
