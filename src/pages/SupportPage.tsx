import { useMemo, useState } from "react";
import { LayoutGrid, Clock, CheckCircle2, Star, BarChart3, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlataformasTab from "@/components/PlataformasTab";
import ClientesAcessosTab from "@/components/ClientesAcessosTab";
import { useSupportTickets, computeMetrics, STATUS_META, CATEGORIA_META, type TicketStatus, type SupportTicket } from "@/hooks/useSupport";
import { useAllClients } from "@/hooks/useAllClients";
import { useLovableProducts } from "@/hooks/useLovableProducts";
import { usePlatformCompanies } from "@/hooks/usePlatformCompanies";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import SupportTicketDialog from "@/components/SupportTicketDialog";
import { useUnreadSupport, markTicketRead } from "@/hooks/useUnreadSupport";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function fmtHours(h: number | null) {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} dias`;
}

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <LayoutGrid size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Gerenciador de Plataformas</h1>
          <p className="text-xs text-muted-foreground">Plataformas, chamados e acessos dos clientes</p>
        </div>
      </div>

      <Tabs defaultValue="chamados" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plataformas">Plataformas</TabsTrigger>
          <TabsTrigger value="chamados">Chamados</TabsTrigger>
          <TabsTrigger value="clientes">Clientes & Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="plataformas">
          <PlataformasTab />
        </TabsContent>

        <TabsContent value="chamados">
          <ChamadosTab />
        </TabsContent>

        <TabsContent value="clientes">
          <ClientesAcessosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChamadosTab() {
  const { data: tickets = [], isLoading } = useSupportTickets();
  const { data: clients = [] } = useAllClients();
  const { products } = useLovableProducts();
  const { data: companies = [] } = usePlatformCompanies();
  const { data: unread } = useUnreadSupport();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const openTicket = (t: SupportTicket) => {
    setSelected(t);
    markTicketRead(t.id, "team");
  };

  const clientMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.nome])), [clients]);
  const companyMap = useMemo(() => Object.fromEntries(companies.map((c) => [c.id, c.nome])), [companies]);
  const nameForTicket = (t: SupportTicket) =>
    (t as any).platform_company_id
      ? companyMap[(t as any).platform_company_id] ?? "—"
      : clientMap[t.client_id] ?? "—";
  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.nome])), [products]);

  const metrics = useMemo(() => computeMetrics(tickets), [tickets]);

  const filtered = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    const s = search.toLowerCase();
    if (!s) return true;
    return (
      t.titulo.toLowerCase().includes(s) ||
      nameForTicket(t).toLowerCase().includes(s) ||
      t.descricao.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={Clock} label="1ª resposta" value={fmtHours(metrics.avgFirstResponseHours)} sub={`${tickets.filter(t => t.first_response_at).length} respondidos`} />
        <MetricCard icon={CheckCircle2} label="Resolução" value={fmtHours(metrics.avgResolutionHours)} sub={`${tickets.filter(t => t.resolved_at).length} resolvidos`} />
        <MetricCard icon={Star} label="CSAT" value={metrics.csatAvg != null ? `${metrics.csatAvg.toFixed(1)} / 5` : "—"} sub={`${metrics.csatCount} avaliações`} />
        <MetricCard icon={BarChart3} label="Total" value={String(metrics.total)} sub={`${metrics.byStatus.aberto + metrics.byStatus.em_andamento} ativos`} />
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(STATUS_META) as TicketStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {STATUS_META[s].label} <span className="opacity-60">({metrics.byStatus[s] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <BreakdownCard
          title="Por categoria"
          items={Object.entries(metrics.byCategoria).map(([k, v]) => ({ label: CATEGORIA_META[k as keyof typeof CATEGORIA_META]?.label ?? k, count: v }))}
        />
        <BreakdownCard
          title="Top empresas"
          items={metrics.byClient.slice(0, 5).map((b) => ({ label: clientMap[b.client_id] ?? "—", count: b.count }))}
        />
        <BreakdownCard
          title="Top produtos"
          items={metrics.byProduct.slice(0, 5).map((b) => ({ label: productMap[b.product_id] ?? "—", count: b.count }))}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 bg-secondary border-border text-sm"
        />
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum chamado.</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const meta = STATUS_META[t.status];
              const u = unread?.perTicket[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{t.titulo}</p>
                      {u > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {u > 9 ? "9+" : u}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{nameForTicket(t)}{t.product_id && productMap[t.product_id] ? ` · ${productMap[t.product_id]}` : ""}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{CATEGORIA_META[t.categoria].label}</Badge>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">{format(new Date(t.opened_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.cls}`}>{meta.label}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <SupportTicketDialog ticket={selected} clientName={selected ? nameForTicket(selected) : undefined} onClose={() => setSelected(null)} />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon size={14} />
        <span className="text-[11px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="text-xl font-bold font-mono mt-2">{value}</div>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function BreakdownCard({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {items.map((i) => (
            <div key={i.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="truncate">{i.label}</span>
                <span className="font-mono text-muted-foreground">{i.count}</span>
              </div>
              <div className="h-1.5 rounded bg-secondary overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}