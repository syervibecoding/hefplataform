import StatCard from "@/components/StatCard";
import StatusTag from "@/components/StatusTag";
import { type Melhoria } from "@/data/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useAllClients, clientMonthlyRevenue, type ClientRow } from "@/hooks/useAllClients";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { type Product } from "@/hooks/useProducts";
import { getIcon } from "@/lib/icon-map";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  products: Product[];
  melhorias: Melhoria[];
}

export default function GeneralDashboardPage({ products, melhorias }: Props) {
  const { isAdmin } = useAuth();
  const { data: allClients = [] } = useAllClients(isAdmin);
  const { data: financialOverview = [] } = useFinancialOverview(isAdmin);

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores</p>
      </div>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const activeClients = allClients.filter((c) => c.status === "ativo");
  const totalRevenue = activeClients.reduce((s, c) => s + clientMonthlyRevenue(c, now), 0);
  const totalRevenueAll = financialOverview.reduce((s, o) => s + o.totalRevenue, 0);
  const emDev = melhorias.filter((m) => m.status === "em_desenvolvimento").length;

  const clientsByProduct = (pid: string) => activeClients.filter((c) => c.product_id === pid);

  const plataformasMes = activeClients.filter((c) => {
    if (c.product_id !== "plataformas" || !c.data_implementacao) return false;
    const di = new Date(c.data_implementacao + "T00:00:00");
    return di >= monthStart && di <= monthEnd;
  });

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Dashboard Geral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão consolidada de todos os produtos · {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard label="Clientes Ativos" value={activeClients.length} sub="todos os produtos" colorClass="text-primary" />
        <StatCard
          label="Receita do Mês"
          value={`R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub="consolidada"
          colorClass="text-hef-success"
        />
        <StatCard label="Produtos" value={products.length} sub="cadastrados" colorClass="text-hef-info" />
        <StatCard label="Em Desenvolvimento" value={emDev} sub="melhorias ativas" colorClass="text-hef-warning" />
      </div>

      {/* Visão Financeira por Produto */}
      <div className="mb-7">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Visão Financeira por Produto
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {products.map((p) => {
            const data = financialOverview.find((o) => o.productId === p.id);
            const Icon = getIcon(p.icon);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {Icon && <Icon className="w-4 h-4 text-primary" />}
                  <span className="text-xs font-semibold truncate">{p.nome}</span>
                </div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {data?.clientCount || 0}{" "}
                  <span className="text-xs font-normal text-muted-foreground">ativos</span>
                </div>
                <div className="text-sm font-semibold font-mono text-hef-success mt-0.5">
                  R$ {(data?.totalRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="text-xs font-semibold text-primary mb-2">TOTAL</div>
            <div className="text-lg font-bold font-mono text-foreground">
              {activeClients.length} <span className="text-xs font-normal text-muted-foreground">ativos</span>
            </div>
            <div className="text-sm font-semibold font-mono text-hef-success mt-0.5">
              R$ {totalRevenueAll.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Implementações Plataformas neste mês */}
      {plataformasMes.length > 0 && (
        <div className="mb-7 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Implementações de Plataformas este mês</h2>
            <span className="text-[11px] bg-hef-info/12 text-hef-info px-2.5 py-0.5 rounded-md font-semibold">
              {plataformasMes.length} {plataformasMes.length === 1 ? "projeto" : "projetos"}
            </span>
          </div>
          <div>
            {plataformasMes.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-b-0">
                <div>
                  <div className="font-semibold text-sm">{c.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.data_implementacao && new Date(c.data_implementacao + "T00:00:00").toLocaleDateString("pt-BR")}
                    {c.tem_mensalidade && " · com mensalidade"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold font-mono text-hef-info">
                    R$ {c.valor_implementacao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  {c.tem_mensalidade && (
                    <div className="text-[11px] font-mono text-hef-success">
                      + R$ {c.valor_mensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clientes por Produto */}
      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
          Clientes por Produto
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const Icon = getIcon(p.icon);
            const list = clientsByProduct(p.id);
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  {Icon && <Icon className="w-4 h-4 text-primary" />}
                  <h3 className="text-sm font-semibold flex-1">{p.nome}</h3>
                  <span className="text-[11px] bg-secondary px-2 py-0.5 rounded-md font-semibold">
                    {list.length}
                  </span>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="px-4 py-6 text-xs text-muted-foreground text-center">
                      Nenhum cliente ativo
                    </div>
                  ) : (
                    list.map((c: ClientRow) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold truncate">{c.nome}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{c.contato}</div>
                        </div>
                        <div className="text-[11px] font-mono font-semibold text-hef-success ml-2 whitespace-nowrap">
                          R$ {clientMonthlyRevenue(c, now).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}