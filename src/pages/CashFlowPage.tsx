import { useState, useMemo, Fragment } from "react";
import { Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCashFlowYear } from "@/hooks/useCashFlow";
import { categoryLabel, EXPENSE_CATEGORIES } from "@/hooks/useCashExpenses";
import CashFlowSettingsDialog from "@/components/CashFlowSettingsDialog";
import CashFlowDayDetail from "@/components/CashFlowDayDetail";
import { useProducts } from "@/hooks/useProducts";

const MONTH_ABBR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function fmt(v: number) {
  if (v === 0) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtSigned(v: number) {
  if (v === 0) return "—";
  const abs = Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return v < 0 ? `(${abs})` : abs;
}

export default function CashFlowPage() {
  const { isAdmin } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailMonth, setDetailMonth] = useState<number | null>(null);
  const { products } = useProducts();
  const { data, isLoading } = useCashFlowYear(year, isAdmin);

  const productName = (id: string) => products.find((p) => p.id === id)?.nome || id;

  const [expandedRec, setExpandedRec] = useState<Set<string>>(new Set());
  const [expandedDesp, setExpandedDesp] = useState<Set<string>>(new Set());

  // Receitas: produto -> clientes -> 12 meses
  const receitasTree = useMemo(() => {
    if (!data) return [] as Array<{ product: string; values: number[]; total: number; children: Array<{ key: string; label: string; values: number[]; total: number }> }>;
    const products = new Map<string, { values: number[]; clients: Map<string, { label: string; values: number[] }> }>();
    for (const e of data.entries) {
      if (e.tipo !== "receita") continue;
      const m = new Date(e.date + "T00:00:00").getMonth();
      const pid = e.categoria; // product_id
      if (!products.has(pid)) products.set(pid, { values: new Array(12).fill(0), clients: new Map() });
      const node = products.get(pid)!;
      node.values[m] += e.valor;
      const ckey = e.origemId || `avulso-${e.id}`;
      if (!node.clients.has(ckey)) node.clients.set(ckey, { label: e.nome, values: new Array(12).fill(0) });
      node.clients.get(ckey)!.values[m] += e.valor;
    }
    return Array.from(products.entries()).map(([product, n]) => ({
      product,
      values: n.values,
      total: n.values.reduce((a, b) => a + b, 0),
      children: Array.from(n.clients.entries())
        .map(([key, c]) => ({ key, label: c.label, values: c.values, total: c.values.reduce((a, b) => a + b, 0) }))
        .sort((a, b) => b.total - a.total),
    }));
  }, [data]);

  // Despesas: categoria -> itens (cada despesa cadastrada ou avulsa) -> 12 meses
  const despesasTree = useMemo(() => {
    if (!data) return [] as Array<{ categoria: string; values: number[]; total: number; children: Array<{ key: string; label: string; values: number[]; total: number }> }>;
    const cats = new Map<string, { values: number[]; items: Map<string, { label: string; values: number[] }> }>();
    for (const e of data.entries) {
      if (e.tipo !== "despesa") continue;
      const m = new Date(e.date + "T00:00:00").getMonth();
      const cat = e.categoria || "outros";
      if (!cats.has(cat)) cats.set(cat, { values: new Array(12).fill(0), items: new Map() });
      const node = cats.get(cat)!;
      node.values[m] += e.valor;
      const ikey = e.origemId || `avulso-${e.nome}`;
      const label = e.nome;
      if (!node.items.has(ikey)) node.items.set(ikey, { label, values: new Array(12).fill(0) });
      node.items.get(ikey)!.values[m] += e.valor;
    }
    const order = EXPENSE_CATEGORIES.map((c) => c.id);
    return Array.from(cats.entries())
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([categoria, n]) => ({
        categoria,
        values: n.values,
        total: n.values.reduce((a, b) => a + b, 0),
        children: Array.from(n.items.entries())
          .map(([key, it]) => ({ key, label: it.label, values: it.values, total: it.values.reduce((a, b) => a + b, 0) }))
          .sort((a, b) => b.total - a.total),
      }));
  }, [data]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  };

  if (!isAdmin) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-sm text-muted-foreground">Acesso restrito aos administradores.</p>
      </div>
    );
  }

  const detailMonthData = data && detailMonth !== null ? data.months[detailMonth] : null;
  const saldoInicialMes = data && detailMonth !== null
    ? (detailMonth === 0 ? data.saldoInicial : data.months[detailMonth - 1].saldoFinal)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Projeção mensal com base nos clientes ativos e despesas cadastradas.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg px-1 py-1">
            <button onClick={() => setYear((y) => y - 1)} className="p-1 hover:text-primary"><ChevronLeft size={14} /></button>
            <span className="font-mono text-sm font-semibold px-2 min-w-[3rem] text-center">{year}</span>
            <button onClick={() => setYear((y) => y + 1)} className="p-1 hover:text-primary"><ChevronRight size={14} /></button>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border hover:bg-secondary/80 transition-all">
            <Settings size={14} /> Configurações
          </button>
        </div>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          <KPI label="Saldo inicial" value={data.saldoInicial} />
          <KPI label="Receitas no ano" value={data.totalReceitas} accent="success" />
          <KPI label="Despesas no ano" value={data.totalDespesas} accent="danger" />
          <KPI label="Resultado" value={data.totalResultado} accent={data.totalResultado >= 0 ? "success" : "danger"} />
        </div>
      )}

      {isLoading && <div className="bg-card border border-border rounded-xl p-12 text-center text-sm text-muted-foreground">Carregando…</div>}

      {data && (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-secondary/60 text-muted-foreground">
                <th className="text-left px-3 py-2 font-semibold sticky left-0 bg-secondary/60 z-10 min-w-[180px]">Categoria</th>
                {MONTH_ABBR.map((m, i) => (
                  <th key={m} className="text-right px-2 py-2 font-semibold cursor-pointer hover:text-primary" onClick={() => setDetailMonth(i)}>{m}</th>
                ))}
                <th className="text-right px-3 py-2 font-semibold border-l border-border">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* RECEITAS */}
              <tr className="bg-hef-success/5">
                <td colSpan={14} className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-hef-success">Receitas</td>
              </tr>
              {receitasTree.map((r) => {
                const open = expandedRec.has(r.product);
                return (
                  <>
                    <tr key={`r-${r.product}`} className="border-t border-border/60 hover:bg-secondary/30 cursor-pointer" onClick={() => toggle(expandedRec, setExpandedRec, r.product)}>
                      <td className="px-3 py-1.5 sticky left-0 bg-card text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          {open ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
                          <span className="font-medium">{productName(r.product)}</span>
                          <span className="text-[10px] text-muted-foreground">({r.children.length})</span>
                        </span>
                      </td>
                      {r.values.map((v, i) => (
                        <td key={i} className="px-2 py-1.5 text-right font-mono text-muted-foreground">{fmt(v)}</td>
                      ))}
                      <td className="px-3 py-1.5 text-right font-mono font-semibold border-l border-border">{fmt(r.total)}</td>
                    </tr>
                    {open && r.children.map((c) => (
                      <tr key={`r-${r.product}-${c.key}`} className="border-t border-border/40 bg-secondary/10 text-muted-foreground">
                        <td className="px-3 py-1 pl-9 sticky left-0 bg-secondary/10 text-[11px]">{c.label}</td>
                        {c.values.map((v, i) => (
                          <td key={i} className="px-2 py-1 text-right font-mono text-[11px]">{fmt(v)}</td>
                        ))}
                        <td className="px-3 py-1 text-right font-mono text-[11px] border-l border-border">{fmt(c.total)}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
              <tr className="border-t border-border bg-hef-success/10 font-semibold">
                <td className="px-3 py-1.5 sticky left-0 bg-hef-success/10">Total Receitas</td>
                {data.months.map((m, i) => (
                  <td key={i} className="px-2 py-1.5 text-right font-mono">{fmt(m.receitas)}</td>
                ))}
                <td className="px-3 py-1.5 text-right font-mono border-l border-border">{fmt(data.totalReceitas)}</td>
              </tr>

              {/* DESPESAS */}
              <tr className="bg-hef-danger/5">
                <td colSpan={14} className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-hef-danger">Despesas</td>
              </tr>
              {despesasTree.map((d) => {
                const open = expandedDesp.has(d.categoria);
                return (
                  <>
                    <tr key={`d-${d.categoria}`} className="border-t border-border/60 hover:bg-secondary/30 cursor-pointer" onClick={() => toggle(expandedDesp, setExpandedDesp, d.categoria)}>
                      <td className="px-3 py-1.5 sticky left-0 bg-card text-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          {open ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
                          <span className="font-medium">{categoryLabel(d.categoria)}</span>
                          <span className="text-[10px] text-muted-foreground">({d.children.length})</span>
                        </span>
                      </td>
                      {d.values.map((v, i) => (
                        <td key={i} className="px-2 py-1.5 text-right font-mono text-muted-foreground">{fmt(v)}</td>
                      ))}
                      <td className="px-3 py-1.5 text-right font-mono font-semibold border-l border-border">{fmt(d.total)}</td>
                    </tr>
                    {open && d.children.map((it) => (
                      <tr key={`d-${d.categoria}-${it.key}`} className="border-t border-border/40 bg-secondary/10 text-muted-foreground">
                        <td className="px-3 py-1 pl-9 sticky left-0 bg-secondary/10 text-[11px]">{it.label}</td>
                        {it.values.map((v, i) => (
                          <td key={i} className="px-2 py-1 text-right font-mono text-[11px]">{fmt(v)}</td>
                        ))}
                        <td className="px-3 py-1 text-right font-mono text-[11px] border-l border-border">{fmt(it.total)}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
              <tr className="border-t border-border bg-hef-danger/10 font-semibold">
                <td className="px-3 py-1.5 sticky left-0 bg-hef-danger/10">Total Despesas</td>
                {data.months.map((m, i) => (
                  <td key={i} className="px-2 py-1.5 text-right font-mono">{fmt(m.despesas)}</td>
                ))}
                <td className="px-3 py-1.5 text-right font-mono border-l border-border">{fmt(data.totalDespesas)}</td>
              </tr>

              {/* RESULTADO */}
              <tr className="border-t-2 border-border bg-secondary/40 font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-secondary/40">Resultado Operacional</td>
                {data.months.map((m, i) => (
                  <td key={i} className={`px-2 py-2 text-right font-mono ${m.resultado < 0 ? "text-hef-danger" : "text-hef-success"}`}>{fmtSigned(m.resultado)}</td>
                ))}
                <td className={`px-3 py-2 text-right font-mono border-l border-border ${data.totalResultado < 0 ? "text-hef-danger" : "text-hef-success"}`}>{fmtSigned(data.totalResultado)}</td>
              </tr>
              <tr className="border-t border-border bg-primary/5 font-semibold">
                <td className="px-3 py-2 sticky left-0 bg-primary/5">Saldo Final de Caixa</td>
                {data.months.map((m, i) => (
                  <td key={i} className={`px-2 py-2 text-right font-mono ${m.saldoFinal < 0 ? "text-hef-danger" : "text-foreground"}`}>{fmtSigned(m.saldoFinal)}</td>
                ))}
                <td className="px-3 py-2 border-l border-border" />
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground p-3 border-t border-border">
            Clique em um mês para abrir a visão diária. Valores em R$.
          </p>
        </div>
      )}

      <CashFlowSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <CashFlowDayDetail
        open={detailMonth !== null}
        onOpenChange={(v) => !v && setDetailMonth(null)}
        month={detailMonthData}
        year={year}
        saldoInicialMes={saldoInicialMes}
      />
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: "success" | "danger" }) {
  const color = accent === "success" ? "text-hef-success" : accent === "danger" ? "text-hef-danger" : "text-foreground";
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`font-mono text-xl font-bold mt-1 ${color}`}>
        R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}