import StatCard from "@/components/StatCard";
import StatusTag from "@/components/StatusTag";
import { type AnyClient, type ProductId, type Melhoria, isHefSysClient, FREQUENCIAS } from "@/data/constants";
import { getNextScheduleDay } from "@/lib/schedule-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayChecklists } from "@/hooks/useTodayChecklists";
import { useFinancialOverview, type ProductFinancial } from "@/hooks/useFinancialOverview";
import { type Product } from "@/hooks/useProducts";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getIcon } from "@/lib/icon-map";
import { CheckCircle, AlertCircle, Clock, Minus } from "lucide-react";

interface Props {
  clients: AnyClient[];
  melhorias: Melhoria[];
  activeProduct: ProductId;
  products: Product[];
}

function FinancialOverview({ products, overview }: { products: Product[]; overview: ProductFinancial[] }) {
  const totalClients = overview.reduce((s, o) => s + o.clientCount, 0);
  const totalRevenue = overview.reduce((s, o) => s + o.totalRevenue, 0);

  return (
    <div className="mb-7">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Visão Financeira Geral</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {products.map((p) => {
          const data = overview.find((o) => o.productId === p.id);
          const Icon = getIcon(p.icon);
          return (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <span className="text-xs font-semibold truncate">{p.nome}</span>
              </div>
              <div className="text-lg font-bold font-mono text-foreground">{data?.clientCount || 0} <span className="text-xs font-normal text-muted-foreground">ativos</span></div>
              <div className="text-sm font-semibold font-mono text-hef-success mt-0.5">
                R$ {(data?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <div className="text-xs font-semibold text-primary mb-2">TOTAL</div>
          <div className="text-lg font-bold font-mono text-foreground">{totalClients} <span className="text-xs font-normal text-muted-foreground">ativos</span></div>
          <div className="text-sm font-semibold font-mono text-hef-success mt-0.5">
            R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ clients, melhorias, activeProduct, products }: Props) {
  const { isAdmin, canEditChecklist } = useAuth();
  const isHefsys = activeProduct === "hefsys";
  const activeClients = clients.filter((c) => c.status === "ativo");
  const emDev = melhorias.filter((m) => m.status === "em_desenvolvimento").length;

  const hefsysActiveClients = isHefsys
    ? activeClients.filter(isHefSysClient).map((c) => ({ id: c.id, nome: c.nome }))
    : [];

  const { data: todayChecklists } = useTodayChecklists(hefsysActiveClients, canEditChecklist && isHefsys);
  const { data: financialOverview } = useFinancialOverview(isAdmin);

  const hefsysMetrics = () => {
    const hefsysClients = clients.filter(isHefSysClient);
    const totalCnpjs = hefsysClients.reduce((s, c) => s + c.cnpjs, 0);
    const totalFaturamento = hefsysClients.filter((c) => c.status === "ativo").reduce((s, c) => s + (c.faturamento || 0), 0);
    const totalCustoAPI = hefsysClients.filter((c) => c.status === "ativo").reduce((s, c) => s + (c.custoAPI || 0), 0);
    return { totalCnpjs, totalFaturamento, totalCustoAPI };
  };

  const genericMetrics = () => {
    const genericClients = clients.filter((c) => !isHefSysClient(c)) as any[];
    const receita = genericClients.filter((c) => c.status === "ativo").reduce((s: number, c: any) => s + (c.valorContrato || 0), 0);
    return { receita };
  };

  const now = new Date();

  const statusIcon = (status: string) => {
    switch (status) {
      case "completo": return <CheckCircle className="w-4 h-4 text-hef-success" />;
      case "parcial": return <AlertCircle className="w-4 h-4 text-hef-warning" />;
      case "pendente": return <Clock className="w-4 h-4 text-hef-danger" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div>
      {/* Financial Overview - admin only */}
      {isAdmin && financialOverview && financialOverview.length > 0 && (
        <FinancialOverview products={products} overview={financialOverview} />
      )}

      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="Clientes Ativos" value={activeClients.length} sub="neste produto" colorClass="text-primary" />
        {isHefsys ? (
          <>
            <StatCard label="CNPJs Monitorados" value={hefsysMetrics().totalCnpjs} sub="total de empresas" colorClass="text-hef-info" />
            {isAdmin && (
              <>
                <StatCard label="Faturamento/Mês" value={`R$ ${hefsysMetrics().totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub="contratos ativos" colorClass="text-hef-success" />
                <StatCard label="Custo API/Mês" value={`R$ ${hefsysMetrics().totalCustoAPI.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub={`${emDev} melhorias em dev`} colorClass="text-hef-warning" />
              </>
            )}
            {!isAdmin && (
              <StatCard label="Em Desenvolvimento" value={emDev} sub="melhorias ativas" colorClass="text-hef-warning" />
            )}
          </>
        ) : (
          <>
            {isAdmin && (
              <StatCard label="Receita Mensal" value={`R$ ${genericMetrics().receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub="contratos ativos" colorClass="text-hef-info" />
            )}
            <StatCard label="Total Clientes" value={clients.length} sub="cadastrados" colorClass="text-hef-info" />
            <StatCard label="Em Desenvolvimento" value={emDev} sub="melhorias ativas" colorClass="text-hef-warning" />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">{isHefsys ? "Próximas Execuções" : "Clientes Recentes"}</h2>
            <span className="text-[11px] bg-primary/12 text-primary px-2.5 py-0.5 rounded-md font-semibold">
              {isHefsys ? "Esta Semana" : `${activeClients.length} ativos`}
            </span>
          </div>
          <div>
            {isHefsys
              ? clients.filter(isHefSysClient).map((c) => {
                  const nextCert = getNextScheduleDay(c.agendaCertidoes || {}, now.getFullYear(), now.getMonth());
                  const nextCaixa = getNextScheduleDay(c.agendaCaixasPostais || {}, now.getFullYear(), now.getMonth());
                  const nextDay = [nextCert, nextCaixa].filter((d): d is number => d !== null).sort((a, b) => a - b)[0];
                  return (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
                      <div>
                        <div className="font-semibold text-sm">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{c.cnpjs} CNPJs · {c.consultas.length} consultas</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold font-mono">{nextDay ? `Dia ${nextDay}` : "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{FREQUENCIAS.find((f) => f.id === c.frequencia)?.label}</div>
                      </div>
                    </div>
                  );
                })
              : clients.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
                    <div>
                      <div className="font-semibold text-sm">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.contato}</div>
                    </div>
                    <StatusTag status={c.status} />
                  </div>
                ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Melhorias & Desenvolvimento</h2>
            <span className="text-[11px] bg-hef-info/12 text-hef-info px-2.5 py-0.5 rounded-md font-semibold">{emDev} ativas</span>
          </div>
          <div>
            {melhorias.filter((m) => m.status !== "concluido").slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border/50 last:border-b-0 hover:bg-secondary/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  m.prioridade === "alta" ? "bg-hef-danger" : m.prioridade === "media" ? "bg-hef-warning" : "bg-hef-info"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{m.titulo}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{m.tipo}</div>
                </div>
                <StatusTag status={m.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checklist status today - admin only, HefSys */}
      {canEditChecklist && isHefsys && todayChecklists && todayChecklists.length > 0 && (
        <div className="mt-7">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Status dos Checklists Hoje</h2>
              <span className="text-[11px] bg-hef-success/12 text-hef-success px-2.5 py-0.5 rounded-md font-semibold">
                {format(new Date(), "dd/MM", { locale: ptBR })}
              </span>
            </div>
            <div>
              {todayChecklists.map((cl) => (
                <div key={cl.clientId} className="flex items-center gap-4 px-5 py-3.5 border-b border-border/50 last:border-b-0">
                  {statusIcon(cl.status)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{cl.clientName}</div>
                    {cl.status === "sem_execucao" ? (
                      <div className="text-xs text-muted-foreground">Sem execução hoje</div>
                    ) : (
                      <div className="flex items-center gap-3 mt-1.5">
                        <Progress value={cl.totalSteps > 0 ? (cl.doneSteps / cl.totalSteps) * 100 : 0} className="h-2 flex-1 max-w-[200px]" />
                        <span className="text-xs font-mono text-muted-foreground">{cl.doneSteps}/{cl.totalSteps}</span>
                      </div>
                    )}
                  </div>
                  {cl.users.length > 0 && (
                    <div className="text-right">
                      <div className="text-xs font-medium">{cl.users[0].username}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(cl.users[0].at), "HH:mm")}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
