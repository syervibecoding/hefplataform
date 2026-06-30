import { useState } from "react";
import { Wallet, Settings } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusTag from "@/components/StatusTag";
import InvestmentsManagerDialog from "@/components/InvestmentsManagerDialog";
import { type Melhoria } from "@/data/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useAllClients, clientMonthlyRevenue, type ClientRow } from "@/hooks/useAllClients";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { type Product } from "@/hooks/useProducts";
import { useCashFlowYear } from "@/hooks/useCashFlow";
import { categoryLabel } from "@/hooks/useCashExpenses";
import { useInvestments } from "@/hooks/useInvestments";
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
  const now = new Date();
  const { data: cashFlow } = useCashFlowYear(now.getFullYear(), isAdmin);
  const { investments, balances, totalSaldo } = useInvestments(isAdmin);
  const [invDialogOpen, setInvDialogOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores</p>
      </div>
    );
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const activeClients = allClients.filter((c) => c.status === "ativo");
  // Plataformas de IA são projetos pontuais/realizados — não contam como
  // clientes ativos recorrentes (exceto quando têm mensalidade vigente).
  const isRecurringActive = (c: ClientRow) => {
    if (c.product_id !== "plataformas") return true;
    if (!c.tem_mensalidade) return false;
    if (!c.data_implementacao) return false;
    return new Date(c.data_implementacao + "T00:00:00") <= monthEnd;
  };
  const recurringActiveClients = activeClients.filter(isRecurringActive);
  const totalRevenue = activeClients.reduce((s, c) => s + clientMonthlyRevenue(c, now), 0);
  const totalRevenueAll = financialOverview.reduce((s, o) => s + o.totalRevenue, 0);
  const emDev = melhorias.filter((m) => m.status === "em_desenvolvimento").length;

  const clientsByProduct = (pid: string) => activeClients.filter((c) => c.product_id === pid);

  const plataformasMes = activeClients.filter((c) => {
    if (c.product_id !== "plataformas" || !c.data_implementacao) return false;
    const di = new Date(c.data_implementacao + "T00:00:00");
    return di >= monthStart && di <= monthEnd;
  });

  const monthData = cashFlow?.months[now.getMonth()];
  const despesasByCat = monthData?.byCategoryDespesa || {};
  const totalDespesasMes = Object.values(despesasByCat).reduce((s, v) => s + v, 0);
  const categoriasOrdenadas = Object.entries(despesasByCat)
    .map(([id, valor]) => ({ id, label: categoryLabel(id), valor, pct: totalDespesasMes > 0 ? (valor / totalDespesasMes) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);

  const CATEGORY_COLORS = [
    "bg-primary", "bg-hef-info", "bg-hef-success", "bg-hef-warning",
    "bg-destructive", "bg-purple-500", "bg-pink-500", "bg-cyan-500",
  ];

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold">Dashboard Geral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão consolidada de todos os produtos · {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard label="Clientes Ativos" value={recurringActiveClients.length} sub="recorrentes (sem projetos)" colorClass="text-primary" />
        <StatCard
          label="Receita do Mês"
          value={`R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub="consolidada"
          colorClass="text-hef-success"
        />
        <StatCard
          label="Despesas do Mês"
          value={`R$ ${totalDespesasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={`${categoriasOrdenadas.length} categorias`}
          colorClass="text-hef-warning"
        />
        <StatCard
          label="Investido"
          value={`R$ ${totalSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          sub={`${investments.length} ${investments.length === 1 ? "aplicação" : "aplicações"}`}
          colorClass="text-hef-info"
        />
      </div>

      {/* Despesas por categoria + Investimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-7">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Despesas por Categoria · {format(now, "MMM/yy", { locale: ptBR })}</h2>
            <span className="text-[11px] text-muted-foreground font-mono">
              R$ {totalDespesasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {categoriasOrdenadas.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Sem despesas no mês</div>
          ) : (
            <>
              <div className="flex h-2 rounded-full overflow-hidden bg-secondary mb-4">
                {categoriasOrdenadas.map((c, i) => (
                  <div
                    key={c.id}
                    className={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    style={{ width: `${c.pct}%` }}
                    title={`${c.label}: ${c.pct.toFixed(1)}%`}
                  />
                ))}
              </div>
              <div className="space-y-2.5">
                {categoriasOrdenadas.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} />
                    <span className="text-xs flex-1 truncate">{c.label}</span>
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs font-mono font-semibold tabular-nums w-12 text-right">
                      {c.pct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-hef-info" />
              <h2 className="text-sm font-semibold">Investimentos</h2>
            </div>
            <button
              onClick={() => setInvDialogOpen(true)}
              className="text-[11px] text-primary hover:underline flex items-center gap-1"
            >
              <Settings size={11} /> Gerenciar
            </button>
          </div>
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Saldo total</div>
            <div className="text-2xl font-bold font-mono text-hef-info">
              R$ {totalSaldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          {investments.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Nenhuma aplicação cadastrada.{" "}
              <button onClick={() => setInvDialogOpen(true)} className="text-primary hover:underline">
                Adicionar
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {investments.map((inv) => {
                const saldo = balances.get(inv.id) || 0;
                const pct = totalSaldo > 0 ? (saldo / totalSaldo) * 100 : 0;
                return (
                  <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{inv.nome}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {inv.instituicao || "—"}{inv.rendimento_anual ? ` · ${inv.rendimento_anual}% a.a.` : ""}
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="text-xs font-mono font-semibold text-hef-info">
                        R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{pct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
              {recurringActiveClients.length} <span className="text-xs font-normal text-muted-foreground">ativos</span>
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
                      {p.id === "plataformas" ? "Nenhum projeto" : "Nenhum cliente ativo"}
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
      <InvestmentsManagerDialog open={invDialogOpen} onOpenChange={setInvDialogOpen} />
    </div>
  );
}