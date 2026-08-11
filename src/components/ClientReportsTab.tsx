import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInMonths, parseISO, startOfMonth, endOfMonth, addMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Package, LifeBuoy, CalendarDays, Search, CheckCircle2, Clock, FileDown, FileText, Pencil, Eye, EyeOff, Plus, Trash2, Check, ChevronLeft, ChevronRight, Link2, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateClientReportPdf, clientReportPdfDataUri } from "@/lib/clientReportPdf";
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
  const [periodo, setPeriodo] = useState(() => startOfMonth(new Date()));
  const periodoRef = format(periodo, "yyyy-MM");
  const periodoLabel = format(periodo, "MMMM 'de' yyyy", { locale: ptBR });
  const range = { start: startOfMonth(periodo), end: endOfMonth(periodo) };
  const { settings, items, saveSettings, saveItem, deleteItem } = useClientReport(client.id, periodoRef);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      data_referencia: settings?.data_referencia ?? format(range.end, "yyyy-MM-dd"),
      periodo_inicio: settings?.periodo_inicio ?? format(range.start, "yyyy-MM-dd"),
      periodo_fim: settings?.periodo_fim ?? format(range.end, "yyyy-MM-dd"),
      introducao: settings?.introducao ?? "",
      conclusao: settings?.conclusao ?? "",
    });
  }, [settings, client.id, periodoRef]);

  const overrides = useMemo(
    () => Object.fromEntries(items.map((i) => [i.item_key, i])),
    [items]
  );

  const meses = inicio ? Math.max(1, differenceInMonths(new Date(), parseISO(inicio)) + 1) : null;
  const valorMensal = client.faturamento ?? client.valor_contrato ?? client.valor_mensalidade ?? 0;
  const portalUrl =
    client.support_enabled && client.support_slug
      ? `${window.location.origin}/suporte/p/${client.support_slug}`
      : null;

  const inMonth = (iso?: string | null) =>
    !!iso && isWithinInterval(parseISO(iso), { start: range.start, end: range.end });

  const monthTickets = useMemo(
    () =>
      tickets
        .filter(
          (t) =>
            inMonth(t.opened_at) ||
            inMonth(t.first_response_at) ||
            inMonth(t.resolved_at) ||
            inMonth(t.closed_at)
        )
        .sort((a, b) => (a.opened_at < b.opened_at ? 1 : -1)),
    [tickets, periodoRef]
  );

  const resolvidosMes = monthTickets.filter((t) => inMonth(t.resolved_at) || inMonth(t.closed_at)).length;
  const tempoMedio = useMemo(() => {
    const durs = monthTickets
      .filter((t) => t.resolved_at)
      .map((t) => (new Date(t.resolved_at!).getTime() - new Date(t.opened_at).getTime()) / 36e5);
    if (!durs.length) return "—";
    const h = durs.reduce((a, b) => a + b, 0) / durs.length;
    return h < 24 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}d`;
  }, [monthTickets]);

  const platNome = (productId: string | null) =>
    plats.find((p) => p.product.id === productId)?.product.nome ?? "—";

  const ticketsDaPlataforma = (productId: string) =>
    monthTickets.filter((t) => t.product_id === productId);

  const ticketsResumo = (productId: string) => {
    const list = ticketsDaPlataforma(productId);
    if (!list.length) return null;
    return list.map((t) => `• ${t.titulo} (${STATUS_META[t.status]?.label ?? t.status})`).join("\n");
  };

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
    monthTickets.forEach((t) =>
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
      .filter((it) => it.date >= format(range.start, "yyyy-MM-dd") && it.date <= format(range.end, "yyyy-MM-dd"))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [client, plats, monthTickets, interactions, inicio, items, overrides, periodoRef]);

  const historico = useMemo(() => {
    const marcos: { date: string; title: string }[] = [];
    if (inicio) marcos.push({ date: inicio, title: "Início do contrato" });
    if (client.data_golive) marcos.push({ date: client.data_golive, title: "Go-live" });
    plats.forEach((p) =>
      marcos.push({
        date: p.link.data_replicacao || p.product.created_at.slice(0, 10),
        title: `Plataforma entregue: ${p.product.nome}`,
      })
    );
    return marcos
      .filter((m) => m.date < format(range.start, "yyyy-MM-dd"))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [client, plats, inicio, periodoRef]);

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

  const buildPdfData = () => ({
        clientName: client.nome,
        periodoRef,
        periodoLabel,
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
          { label: "Chamados no mês", value: String(monthTickets.length) },
          { label: "Resolvidos", value: String(resolvidosMes) },
          { label: "Tempo médio", value: tempoMedio },
          { label: "Plataformas ativas", value: String(plats.length) },
        ],
        portalUrl,
        chamados: monthTickets.map((t) => ({
          titulo: t.titulo,
          plataforma: platNome(t.product_id),
          categoria: CATEGORIA_META[t.categoria]?.label ?? t.categoria,
          status: STATUS_META[t.status]?.label ?? t.status,
          aberto: format(parseISO(t.opened_at), "dd/MM/yyyy"),
          resolvido: t.resolved_at ? format(parseISO(t.resolved_at), "dd/MM/yyyy") : "—",
        })),
        plataformas: plats
          .filter(({ product }) => !overrides[`plat:${product.id}`]?.hidden)
          .map(({ link, product }) => ({
            nome: overrides[`plat:${product.id}`]?.titulo ?? product.nome,
            descricao:
              overrides[`plat:${product.id}`]?.descricao ??
              ticketsResumo(product.id) ??
              product.descricao ??
              null,
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

  const exportPdf = () => {
    try {
      generateClientReportPdf(buildPdfData());
      toast.success("Relatório em PDF gerado");
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar o PDF");
    }
  };

  useEffect(() => {
    if (!preview) {
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      return;
    }
    let url: string | null = null;
    try {
      url = clientReportPdfDataUri(buildPdfData());
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível gerar a prévia");
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, client.id, periodoRef, form, overrides, monthTickets, timeline, plats, portalUrl]);

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold truncate">{form.titulo || client.nome}</h2>
            <p className="text-xs text-muted-foreground">
              {form.subtitulo ||
                `Competência ${periodoLabel}${inicio ? ` · Cliente desde ${format(parseISO(inicio), "MMM/yyyy", { locale: ptBR })}` : ""}${meses ? ` · ${meses} ${meses === 1 ? "mês" : "meses"}` : ""}`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-1 py-0.5">
              <button
                onClick={() => setPeriodo((p) => addMonths(p, -1))}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Mês anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-medium capitalize min-w-[92px] text-center">{periodoLabel}</span>
              <button
                onClick={() => setPeriodo((p) => addMonths(p, 1))}
                className="p-1 text-muted-foreground hover:text-foreground"
                title="Próximo mês"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            {valorMensal > 0 && (
              <Badge variant="outline" className="font-mono text-[11px]">{brl(valorMensal)}/mês</Badge>
            )}
            <Button
              size="sm"
              variant={editing ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={() => (editing ? handleSaveSettings() : setEditing(true))}
            >
              {editing ? <Check size={14} /> : <Pencil size={14} />}
              {editing ? "Salvar" : "Editar"}
            </Button>
            <Button
              size="sm"
              variant={preview ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={() => setPreview((p) => !p)}
            >
              <FileText size={14} />
              {preview ? "Fechar prévia" : "Prévia do PDF"}
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={exportPdf}>
              <FileDown size={14} />
              Exportar PDF
            </Button>
          </div>
        </div>

        {preview && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">
                Prévia atualizada automaticamente conforme suas edições
              </span>
            </div>
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={`Prévia do relatório de ${client.nome}`}
                className="w-full h-[70vh] min-h-[420px] rounded-lg border border-border bg-secondary"
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                Gerando prévia…
              </div>
            )}
          </div>
        )}

        {editing && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-border pt-4">
            <div>
              <label className="text-[11px] text-muted-foreground">Título do relatório</label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder={client.nome} className="mt-1 h-8 bg-secondary border-border text-sm" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Subtítulo</label>
              <Input value={form.subtitulo} onChange={(e) => setForm((f) => ({ ...f, subtitulo: e.target.value }))} className="mt-1 h-8 bg-secondary border-border text-sm" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">Data do relatório</label>
              <Input type="date" value={form.data_referencia} onChange={(e) => setForm((f) => ({ ...f, data_referencia: e.target.value }))} className="mt-1 h-8 bg-secondary border-border text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">Período de</label>
                <Input type="date" value={form.periodo_inicio} onChange={(e) => setForm((f) => ({ ...f, periodo_inicio: e.target.value }))} className="mt-1 h-8 bg-secondary border-border text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">até</label>
                <Input type="date" value={form.periodo_fim} onChange={(e) => setForm((f) => ({ ...f, periodo_fim: e.target.value }))} className="mt-1 h-8 bg-secondary border-border text-sm" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] text-muted-foreground">Introdução</label>
              <Textarea value={form.introducao} onChange={(e) => setForm((f) => ({ ...f, introducao: e.target.value }))} rows={3} className="mt-1 bg-secondary border-border text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[11px] text-muted-foreground">Conclusão</label>
              <Textarea value={form.conclusao} onChange={(e) => setForm((f) => ({ ...f, conclusao: e.target.value }))} rows={3} className="mt-1 bg-secondary border-border text-sm" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={LifeBuoy} label="Chamados no mês" value={String(monthTickets.length)} />
        <Kpi icon={CheckCircle2} label="Resolvidos" value={String(resolvidosMes)} />
        <Kpi icon={Timer} label="Tempo médio" value={tempoMedio} />
        <Kpi icon={Package} label="Plataformas ativas" value={String(plats.length)} />
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Chamados atendidos em {periodoLabel}
        </p>
        {monthTickets.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum chamado com atividade neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="text-left font-semibold py-1.5 pr-3">Chamado</th>
                  <th className="text-left font-semibold py-1.5 pr-3">Plataforma</th>
                  <th className="text-left font-semibold py-1.5 pr-3">Categoria</th>
                  <th className="text-left font-semibold py-1.5 pr-3">Status</th>
                  <th className="text-left font-semibold py-1.5 pr-3">Aberto</th>
                  <th className="text-left font-semibold py-1.5">Resolvido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthTickets.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-3 font-medium max-w-[220px] truncate">{t.titulo}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{platNome(t.product_id)}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{CATEGORIA_META[t.categoria]?.label ?? t.categoria}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className="text-[10px]">{STATUS_META[t.status]?.label ?? t.status}</Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{format(parseISO(t.opened_at), "dd/MM")}</td>
                    <td className="py-2 font-mono text-[11px] text-muted-foreground">
                      {t.resolved_at ? format(parseISO(t.resolved_at), "dd/MM") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {portalUrl && (
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Link2 size={12} className="text-primary" />
            Portal do cliente:{" "}
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
              {portalUrl}
            </a>
          </p>
        )}
      </div>

      {plats.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Plataformas entregues
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plats.map(({ link, product }) => {
              const key = `plat:${product.id}`;
              const o = overrides[key];
              const dataVal = o?.data || link.data_replicacao || product.created_at.slice(0, 10);
              if (!editing && o?.hidden) return null;
              const desc = o?.descricao ?? ticketsResumo(product.id) ?? product.descricao ?? "";
              return (
                <div key={product.id} className={`flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2 ${o?.hidden ? "opacity-40" : ""}`}>
                  <Package size={14} className="text-primary shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5">
                        <Input
                          defaultValue={o?.titulo ?? product.nome}
                          onBlur={(e) => saveItem.mutate({ item_key: key, kind: "plataforma", titulo: e.target.value })}
                          className="h-7 bg-background border-border text-xs"
                        />
                        <Input
                          type="date"
                          defaultValue={dataVal}
                          onChange={(e) => saveItem.mutate({ item_key: key, kind: "plataforma", data: e.target.value })}
                          className="h-7 w-[130px] bg-background border-border text-xs"
                        />
                        </div>
                        <Textarea
                          defaultValue={desc}
                          rows={2}
                          placeholder="O que foi feito nesta entrega..."
                          onBlur={(e) => saveItem.mutate({ item_key: key, kind: "plataforma", descricao: e.target.value })}
                          className="bg-background border-border text-xs"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-medium truncate">{o?.titulo ?? product.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{format(parseISO(dataVal), "dd/MM/yyyy")}</p>
                        {desc && (
                          <p className="mt-1 text-[10px] text-muted-foreground whitespace-pre-line">{desc}</p>
                        )}
                      </>
                    )}
                  </div>
                  {editing ? (
                    <button
                      onClick={() => saveItem.mutate({ item_key: key, kind: "plataforma", hidden: !o?.hidden })}
                      className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                      title={o?.hidden ? "Mostrar no PDF" : "Ocultar do PDF"}
                    >
                      {o?.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  ) : (
                    product.url_app && (
                      <a href={product.url_app} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                        Abrir
                      </a>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
          Linha do tempo de {periodoLabel}
        </p>
        {editing && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              placeholder="Novo registro..."
              value={newItem.titulo}
              onChange={(e) => setNewItem((n) => ({ ...n, titulo: e.target.value }))}
              className="h-8 bg-secondary border-border text-sm"
            />
            <Input
              type="date"
              value={newItem.data}
              onChange={(e) => setNewItem((n) => ({ ...n, data: e.target.value }))}
              className="h-8 w-full sm:w-[150px] bg-secondary border-border text-sm"
            />
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              disabled={!newItem.titulo}
              onClick={() => {
                saveItem.mutate({
                  item_key: `manual:${Date.now()}`,
                  kind: "timeline",
                  manual: true,
                  titulo: newItem.titulo,
                  data: newItem.data || new Date().toISOString().slice(0, 10),
                });
                setNewItem({ titulo: "", data: "", descricao: "" });
              }}
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>
        )}
        {(editing ? timelineAll : timeline).length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem registros.</p>
        ) : (
          <div className="relative pl-4 space-y-3 max-h-[420px] overflow-y-auto">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
            {(editing ? timelineAll : timeline).map((it) => (
              <div key={it.key} className={`relative ${it.hidden ? "opacity-40" : ""}`}>
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
                {editing ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                    <Input
                      defaultValue={it.title}
                      onBlur={(e) => saveItem.mutate({ item_key: it.key, kind: it.kind, manual: it.manual, titulo: e.target.value })}
                      className="h-7 bg-background border-border text-xs"
                    />
                    <Input
                      type="date"
                      defaultValue={it.date}
                      onChange={(e) => saveItem.mutate({ item_key: it.key, kind: it.kind, manual: it.manual, data: e.target.value })}
                      className="h-7 w-[130px] bg-background border-border text-xs shrink-0"
                    />
                    <button
                      onClick={() => saveItem.mutate({ item_key: it.key, kind: it.kind, manual: it.manual, hidden: !it.hidden })}
                      className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                      title={it.hidden ? "Mostrar no PDF" : "Ocultar do PDF"}
                    >
                      {it.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    {it.manual && it.overrideId && (
                      <button
                        onClick={() => deleteItem.mutate(it.overrideId!)}
                        className="p-1 text-destructive/70 hover:text-destructive shrink-0"
                        title="Excluir registro"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    </div>
                    <Textarea
                      defaultValue={it.sub ?? ""}
                      rows={2}
                      placeholder="Descrição do que foi feito..."
                      onBlur={(e) =>
                        saveItem.mutate({ item_key: it.key, kind: it.kind, manual: it.manual, descricao: e.target.value })
                      }
                      className="bg-background border-border text-xs"
                    />
                  </div>
                ) : (
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {historico.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Histórico anterior
          </p>
          <ul className="space-y-1">
            {historico.map((h) => (
              <li key={`${h.date}-${h.title}`} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">{format(parseISO(h.date), "dd/MM/yy")}</span>
                <span className="truncate">{h.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
