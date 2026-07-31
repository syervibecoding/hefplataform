import { useState } from "react";
import { Wallet, Settings, SlidersHorizontal, FileWarning, ChevronLeft, ChevronRight } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusTag from "@/components/StatusTag";
import InvestmentsManagerDialog from "@/components/InvestmentsManagerDialog";
import FinancialSettingsDialog from "@/components/FinancialSettingsDialog";
import { type Melhoria } from "@/data/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useAllClients, clientMonthlyRevenue, type ClientRow } from "@/hooks/useAllClients";
import { useFinancialOverview } from "@/hooks/useFinancialOverview";
import { useClientValueAdjustmentsForClients } from "@/hooks/useClientValueAdjustments";
import { type Product } from "@/hooks/useProducts";
import { useCashFlowYear } from "@/hooks/useCashFlow";
import { categoryLabel } from "@/hooks/useCashExpenses";
import { useInvestments } from "@/hooks/useInvestments";
import { useFinancialSettings } from "@/hooks/useFinancialSettings";
import { useTaxRateHistory, rateForMonth } from "@/hooks/useTaxRateHistory";
import { useResultAllocations } from "@/hooks/useResultAllocations";
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
  const { data: allAdjustments = [] } = useClientValueAdjustmentsForClients(allClients.map((c) => c.id));
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const { data: cashFlow } = useCashFlowYear(selectedYear, isAdmin);
  const { investments, balances, totalSaldo } = useInvestments(isAdmin);
  const { taxRate } = useFinancialSettings(isAdmin);
  const { data: taxHistory = [] } = useTaxRateHistory(isAdmin);
  const { allocations } = useResultAllocations(isAdmin);
  const [invDialogOpen, setInvDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [topScope, setTopScope] = useState<"mes" | "ano">("mes");

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground text-sm">Acesso restrito a administradores</p>
      </div>
    );
  }

  const adjustmentsByClient = new Map<string, { data_inicio: string; novo_valor: number }[]>();
  for (const a of allAdjustments) {
    const arr = adjustmentsByClient.get(a.client_id) || [];
    arr.push({ data_inicio: a.data_inicio, novo_valor: a.novo_valor });
    adjustmentsByClient.set(a.client_id, arr);
  }
  const revenueFor = (c: ClientRow) => clientMonthlyRevenue(c, now, adjustmentsByClient.get(c.id));

  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
  const isCurrentRealMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const isPastMonth = selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth());
  const isFutureMonth = !isCurrentRealMonth && !isPastMonth;

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
  // Plataformas de IA são projetos pontuais — não exigem controle de contrato.
  const unsignedClients = activeClients.filter((c) => c.product_id !== "plataformas" && !c.contrato_assinado);
  const totalRevenue = activeClients.reduce((s, c) => s + revenueFor(c), 0);
  const totalRevenueAll = financialOverview.reduce((s, o) => s + o.totalRevenue, 0);
  const emDev = melhorias.filter((m) => m.status === "em_desenvolvimento").length;

  const clientsByProduct = (pid: string) => activeClients.filter((c) => c.product_id === pid);

  const plataformasMes = activeClients.filter((c) => {
    if (c.product_id !== "plataformas" || !c.data_implementacao) return false;
    const di = new Date(c.data_implementacao + "T00:00:00");
    return di >= monthStart && di <= monthEnd;
  });

  const monthData = cashFlow?.months[selectedMonth];
  const despesasByCat = monthData?.byCategoryDespesa || {};
  const totalDespesasMes = Object.values(despesasByCat).reduce((s, v) => s + v, 0);
  const currentMonthRate = rateForMonth(taxHistory, selectedYear, selectedMonth, Number(taxRate));
  // Faturamento bruto do mês vem das receitas reais lançadas no Fluxo de Caixa
  const faturamentoBrutoMes = monthData?.receitas ?? 0;
  // Imposto: usa o DAS lançado no fluxo (categoria "impostos"), ignorando IOF de
  // compras internacionais — IOF é custo da compra, não imposto sobre faturamento.
  const impostoLancado = (monthData?.entries || [])
    .filter((e) => e.tipo === "despesa" && (e.categoria || "") === "impostos" && !/\biof\b/i.test(e.nome || ""))
    .reduce((s, e) => s + e.valor, 0);
  const impostosIsReal = impostoLancado > 0;
  const impostos = impostosIsReal ? impostoLancado : faturamentoBrutoMes * (currentMonthRate / 100);
  const faturamentoLiquido = faturamentoBrutoMes - impostos;
  // Evita contar imposto duas vezes (ele já está em totalDespesasMes)
  const despesasSemImpostos = totalDespesasMes - impostoLancado;
  const resultado = faturamentoLiquido - despesasSemImpostos;
  const margem = faturamentoBrutoMes > 0 ? (resultado / faturamentoBrutoMes) * 100 : 0;
  // Investimentos/aportes/retiradas ficam FORA do resultado operacional e da margem.
  const investimentosMes = monthData?.investimentos ?? 0;
  const aportesMes = monthData?.aportes ?? 0;
  const retiradasMes = monthData?.retiradas ?? 0;
  const variacaoCaixaMes = resultado - investimentosMes + aportesMes - retiradasMes;
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // Previsão anual mês a mês
  const currentMonthIdx = selectedYear === now.getFullYear() ? now.getMonth() : -1;
  const yearForecast = (cashFlow?.months || []).map((m, i) => {
    const rate = rateForMonth(taxHistory, selectedYear, i, Number(taxRate));
    const bruto = m.receitas;
    const impLancado = (m.entries || [])
      .filter((e) => e.tipo === "despesa" && (e.categoria || "") === "impostos" && !/\biof\b/i.test(e.nome || ""))
      .reduce((s, e) => s + e.valor, 0);
    const imp = impLancado > 0 ? impLancado : bruto * (rate / 100);
    const liquido = bruto - imp;
    const desp = m.despesas - impLancado; // não duplicar imposto
    const res = liquido - desp;
    const mg = bruto > 0 ? (res / bruto) * 100 : 0;
    return { i, rate, bruto, imp, liquido, desp, res, mg, impReal: impLancado > 0 };
  });

  const goPrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };
  const goNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };
  const goToday = () => { setSelectedYear(now.getFullYear()); setSelectedMonth(now.getMonth()); };
  const selectedDate = new Date(selectedYear, selectedMonth, 1);
  const annual = yearForecast.reduce(
    (acc, m) => ({
      bruto: acc.bruto + m.bruto,
      imp: acc.imp + m.imp,
      liquido: acc.liquido + m.liquido,
      desp: acc.desp + m.desp,
      res: acc.res + m.res,
    }),
    { bruto: 0, imp: 0, liquido: 0, desp: 0, res: 0 },
  );
  const annualMargem = annual.bruto > 0 ? (annual.res / annual.bruto) * 100 : 0;
  const maxAbsRes = Math.max(1, ...yearForecast.map((m) => Math.abs(m.res)));
  const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const categoriasOrdenadas = Object.entries(despesasByCat)
    .map(([id, valor]) => ({ id, label: categoryLabel(id), valor, pct: totalDespesasMes > 0 ? (valor / totalDespesasMes) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);

  // ---- Principais despesas por fornecedor (mês ou ano) ----
  // Agrupa variações do mesmo fornecedor (Uber, 99, IOF etc.) em um único nome.
  const canonicalVendor = (nome: string): string => {
    const n = (nome || "").trim();
    const u = n.toUpperCase();
    if (u.includes("UBER")) return "Uber";
    if (/^99\b|99APP|99 TECNOLOGIA|99POP/.test(u)) return "99";
    if (u.includes("LOVABLE")) return "Lovable";
    if (u.includes("OPENAI") || u.includes("CHATGPT") || u.includes("GPT")) return "OpenAI / ChatGPT";
    if (u.includes("INFOSIMPLES")) return "Infosimples";
    if (u.includes("SERPRO") || u.includes("SERVICO FEDERAL DE PROCESSAMENTO")) return "Serpro";
    if (u.includes("HOSTINGER")) return "Hostinger";
    if (u.includes("ANTHROPIC")) return "Anthropic";
    if (u.includes("GOOGLE WORKSPACE")) return "Google Workspace";
    return n.replace(/\s+—\s+IOF.*$/i, "").replace(/\s*-\s*Parcela.*$/i, "").trim() || "Outros";
  };

  const despesaEntriesMes = (monthData?.entries || []).filter((e) => e.tipo === "despesa");
  const despesaEntriesAno = (cashFlow?.months || []).flatMap((m) => (m.entries || []).filter((e) => e.tipo === "despesa"));
  const baseVendorEntries = topScope === "ano" ? despesaEntriesAno : despesaEntriesMes;
  const vendorMap = new Map<string, { valor: number; categoria: string; count: number }>();
  for (const e of baseVendorEntries) {
    const key = canonicalVendor(e.nome || "");
    const cur = vendorMap.get(key) || { valor: 0, categoria: e.categoria || "outros", count: 0 };
    cur.valor += e.valor;
    cur.count += 1;
    vendorMap.set(key, cur);
  }
  const totalVendors = Array.from(vendorMap.values()).reduce((s, v) => s + v.valor, 0);
  const topVendors = Array.from(vendorMap.entries())
    .map(([nome, v]) => ({ nome, ...v, pct: totalVendors > 0 ? (v.valor / totalVendors) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 12);
  const maxVendor = Math.max(1, ...topVendors.map((v) => v.valor));

  const CATEGORY_COLORS = [
    "bg-primary", "bg-hef-info", "bg-hef-success", "bg-hef-warning",
    "bg-destructive", "bg-purple-500", "bg-pink-500", "bg-cyan-500",
  ];

  return (
    <div>
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Geral</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão consolidada de todos os produtos · {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-xs text-primary hover:underline flex items-center gap-1.5 shrink-0"
        >
          <SlidersHorizontal size={13} /> Configurações
        </button>
      </div>

      {unsignedClients.length > 0 && (
        <div className="mb-5 bg-hef-warning/10 border border-hef-warning/20 rounded-xl p-4 flex items-start gap-3">
          <FileWarning size={18} className="text-hef-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-hef-warning">
              {unsignedClients.length} contrato{unsignedClients.length > 1 ? "s" : ""} pendente{unsignedClients.length > 1 ? "s" : ""} de assinatura
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {unsignedClients.map((c) => c.nome).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Navegador de mês para KPIs do mês */}
      <div className="mb-3 flex items-center justify-between gap-3 bg-card border border-border rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-semibold capitalize min-w-[160px] text-center">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <button
            onClick={goNextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
          {isCurrentRealMonth ? (
            <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Atual</span>
          ) : isFutureMonth ? (
            <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-hef-info bg-hef-info/10 px-1.5 py-0.5 rounded">Projeção</span>
          ) : (
            <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">Congelado</span>
          )}
        </div>
        {!isCurrentRealMonth && (
          <button
            onClick={goToday}
            className="text-xs text-primary hover:underline"
          >
            Ir para hoje
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard label="Clientes Ativos" value={recurringActiveClients.length} sub="recorrentes (sem projetos)" colorClass="text-primary" />
        <StatCard
          label="Faturamento Bruto"
          value={fmt(faturamentoBrutoMes)}
          sub="receitas do mês (fluxo)"
          colorClass="text-hef-success"
        />
        <StatCard
          label="Despesas do Mês"
          value={fmt(totalDespesasMes)}
          sub={`${categoriasOrdenadas.length} categorias`}
          colorClass="text-hef-warning"
        />
        <StatCard
          label="Investido"
          value={fmt(totalSaldo)}
          sub={`${investments.length} ${investments.length === 1 ? "aplicação" : "aplicações"}`}
          colorClass="text-hef-info"
        />
      </div>

      {/* KPIs de resultado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard
          label={impostosIsReal ? "Impostos (real)" : `Impostos (${currentMonthRate.toFixed(1)}%)`}
          value={fmt(impostos)}
          sub={impostosIsReal ? "DAS lançado no fluxo" : "estimado · sem DAS lançado"}
          colorClass="text-hef-warning"
        />
        <StatCard
          label="Faturamento Líquido"
          value={fmt(faturamentoLiquido)}
          sub={`base: ${fmt(faturamentoBrutoMes)} (fluxo)`}
          colorClass="text-hef-info"
        />
        <StatCard
          label="Resultado Operacional"
          value={fmt(resultado)}
          sub="líquido − despesas"
          colorClass={resultado >= 0 ? "text-hef-success" : "text-destructive"}
        />
        <StatCard
          label="Margem de Lucro"
          value={`${margem.toFixed(1)}%`}
          sub="resultado / bruto"
          colorClass={margem >= 0 ? "text-hef-success" : "text-destructive"}
        />
      </div>

      {/* Movimentações após o resultado — não afetam margem */}
      <div className="mb-7 bg-card border border-border rounded-xl p-4">
        <p className="text-[11px] text-muted-foreground mb-3">
          Abaixo da linha do resultado — investimentos e movimentações de sócios <strong>não</strong> entram no custo nem na margem.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Resultado operacional</p>
            <p className={`font-mono font-bold ${resultado >= 0 ? "text-hef-success" : "text-destructive"}`}>{fmt(resultado)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">(−) Investimentos do mês</p>
            <p className="font-mono font-bold text-hef-info">{fmt(investimentosMes)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Aportes / Retiradas</p>
            <p className="font-mono font-bold text-muted-foreground">
              +{fmt(aportesMes)} / −{fmt(retiradasMes)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Variação de caixa</p>
            <p className={`font-mono font-bold ${variacaoCaixaMes >= 0 ? "text-hef-success" : "text-destructive"}`}>{fmt(variacaoCaixaMes)}</p>
          </div>
        </div>
      </div>

      {/* Alocação do resultado */}
      <div className="mb-7 bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Alocação do Resultado</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Distribuição sugerida do resultado operacional do mês
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-[11px] text-primary hover:underline flex items-center gap-1"
          >
            <Settings size={11} /> Gerenciar
          </button>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Resultado</span>
          <span className={`text-xl font-bold font-mono ${resultado >= 0 ? "text-hef-success" : "text-destructive"}`}>
            {fmt(resultado)}
          </span>
        </div>

        {allocations.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            Nenhuma categoria cadastrada.{" "}
            <button onClick={() => setSettingsOpen(true)} className="text-primary hover:underline">
              Adicionar
            </button>
          </div>
        ) : resultado <= 0 ? (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            Resultado não positivo — nenhuma alocação aplicada este mês.
          </div>
        ) : (
          <>
            <div className="flex h-2 rounded-full overflow-hidden bg-secondary mb-4">
              {allocations.map((a) => (
                <div
                  key={a.id}
                  className={a.cor}
                  style={{ width: `${a.percentual}%` }}
                  title={`${a.nome}: ${a.percentual}%`}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {allocations.map((a) => {
                const valor = resultado * (a.percentual / 100);
                return (
                  <div key={a.id} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.cor}`} />
                    <span className="text-xs flex-1 truncate">{a.nome}</span>
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                      {a.percentual.toFixed(1)}%
                    </span>
                    <span className="text-xs font-mono font-semibold tabular-nums w-28 text-right">
                      {fmt(valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Previsão Anual */}
      <div className="mb-7 bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Previsão Anual · {selectedYear}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Meses passados congelados · mês atual e futuros projetados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-secondary/40 border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bruto anual</div>
            <div className="text-base font-bold font-mono text-hef-success mt-1">{fmt(annual.bruto)}</div>
          </div>
          <div className="bg-secondary/40 border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Impostos anuais</div>
            <div className="text-base font-bold font-mono text-hef-warning mt-1">{fmt(annual.imp)}</div>
          </div>
          <div className="bg-secondary/40 border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Resultado anual</div>
            <div className={`text-base font-bold font-mono mt-1 ${annual.res >= 0 ? "text-hef-success" : "text-destructive"}`}>
              {fmt(annual.res)}
            </div>
          </div>
          <div className="bg-secondary/40 border border-border rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Margem média</div>
            <div className={`text-base font-bold font-mono mt-1 ${annualMargem >= 0 ? "text-hef-success" : "text-destructive"}`}>
              {annualMargem.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="text-left font-semibold py-2 pr-3">Mês</th>
                <th className="text-right font-semibold py-2 px-2">Bruto</th>
                <th className="text-right font-semibold py-2 px-2">Impostos</th>
                <th className="text-right font-semibold py-2 px-2">Líquido</th>
                <th className="text-right font-semibold py-2 px-2">Despesas</th>
                <th className="text-right font-semibold py-2 px-2">Resultado</th>
                <th className="text-right font-semibold py-2 pl-2">Margem</th>
              </tr>
            </thead>
            <tbody>
              {yearForecast.map((m) => {
                const isCurrent = m.i === currentMonthIdx;
                const isPast = m.i < currentMonthIdx;
                return (
                  <tr
                    key={m.i}
                    className={`border-b border-border/40 ${isCurrent ? "bg-primary/5" : ""} ${isPast ? "text-muted-foreground" : ""}`}
                  >
                    <td className="py-2 pr-3 font-semibold">
                      {MESES_ABREV[m.i]}
                      {isCurrent && <span className="ml-1.5 text-[9px] text-primary font-bold">ATUAL</span>}
                    </td>
                    <td className="text-right font-mono tabular-nums py-2 px-2">{fmt(m.bruto)}</td>
                    <td className="text-right font-mono tabular-nums py-2 px-2">
                      {fmt(m.imp)}
                      <span className="text-[9px] text-muted-foreground ml-1">
                        {m.impReal ? "(real)" : `(${m.rate.toFixed(1)}%)`}
                      </span>
                    </td>
                    <td className="text-right font-mono tabular-nums py-2 px-2">{fmt(m.liquido)}</td>
                    <td className="text-right font-mono tabular-nums py-2 px-2">{fmt(m.desp)}</td>
                    <td className={`text-right font-mono tabular-nums py-2 px-2 font-semibold ${m.res >= 0 ? "text-hef-success" : "text-destructive"}`}>
                      {fmt(m.res)}
                    </td>
                    <td className={`text-right font-mono tabular-nums py-2 pl-2 ${m.mg >= 0 ? "text-hef-success" : "text-destructive"}`}>
                      {m.mg.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="py-2 pr-3">Total</td>
                <td className="text-right font-mono tabular-nums py-2 px-2 text-hef-success">{fmt(annual.bruto)}</td>
                <td className="text-right font-mono tabular-nums py-2 px-2 text-hef-warning">{fmt(annual.imp)}</td>
                <td className="text-right font-mono tabular-nums py-2 px-2">{fmt(annual.liquido)}</td>
                <td className="text-right font-mono tabular-nums py-2 px-2">{fmt(annual.desp)}</td>
                <td className={`text-right font-mono tabular-nums py-2 px-2 ${annual.res >= 0 ? "text-hef-success" : "text-destructive"}`}>
                  {fmt(annual.res)}
                </td>
                <td className={`text-right font-mono tabular-nums py-2 pl-2 ${annualMargem >= 0 ? "text-hef-success" : "text-destructive"}`}>
                  {annualMargem.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mini-gráfico de resultado por mês */}
        <div className="mt-5 pt-4 border-t border-border">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
            Resultado por mês
          </div>
          <div className="space-y-1.5">
            {yearForecast.map((m) => {
              const pct = (Math.abs(m.res) / maxAbsRes) * 100;
              const positive = m.res >= 0;
              return (
                <div key={m.i} className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold w-8 text-muted-foreground">{MESES_ABREV[m.i]}</span>
                  <div className="flex-1 flex items-center h-4">
                    <div className="flex-1 flex justify-end pr-1">
                      {!positive && (
                        <div className="h-2.5 bg-destructive/70 rounded-l-sm" style={{ width: `${pct}%` }} />
                      )}
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex-1 pl-1">
                      {positive && (
                        <div className="h-2.5 bg-hef-success/70 rounded-r-sm" style={{ width: `${pct}%` }} />
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono tabular-nums w-24 text-right ${positive ? "text-hef-success" : "text-destructive"}`}>
                    {fmt(m.res)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Despesas por categoria + Investimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-7">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Despesas por Categoria · {format(selectedDate, "MMM/yy", { locale: ptBR })}</h2>
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
                          R$ {revenueFor(c).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
      <FinancialSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}