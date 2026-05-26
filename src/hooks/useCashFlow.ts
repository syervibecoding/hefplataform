import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EntryType = "receita" | "despesa" | "investimento" | "aporte" | "retirada";

export const ENTRY_TYPE_META: Record<EntryType, { label: string; sign: 1 | -1; bucket: "receita" | "despesa" | "investimento" | "aporte" | "retirada" }> = {
  receita: { label: "Receita", sign: 1, bucket: "receita" },
  despesa: { label: "Despesa", sign: -1, bucket: "despesa" },
  investimento: { label: "Investimento", sign: -1, bucket: "investimento" },
  aporte: { label: "Aporte de sócio", sign: 1, bucket: "aporte" },
  retirada: { label: "Retirada de sócio", sign: -1, bucket: "retirada" },
};

export interface CashEntry {
  id: string;             // synthetic id for the projected entry
  tipo: EntryType;
  date: string;           // YYYY-MM-DD
  nome: string;
  categoria: string;      // for despesas; for receitas = product_id
  valor: number;
  origemTipo: "cliente" | "despesa" | "avulso";
  origemId: string | null;
  overrideId?: string | null;
}

function lastBusinessDay(year: number, month: number): number {
  // month: 0-indexed
  const d = new Date(year, month + 1, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return d.getDate();
}

function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function toISO(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

async function fetchAll(year: number) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const [clientsRes, expensesRes, overridesRes, settingsRes] = await Promise.all([
    supabase.from("clients").select("id, nome, product_id, status, valor_contrato, faturamento, valor_implementacao, valor_mensalidade, tem_mensalidade, data_implementacao, dia_pagamento").eq("status", "ativo"),
    supabase.from("cash_expenses").select("*").eq("ativo", true),
    supabase.from("cash_overrides").select("*").gte("data", yearStart).lte("data", yearEnd),
    supabase.from("cash_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (clientsRes.error) throw clientsRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (overridesRes.error) throw overridesRes.error;
  if (settingsRes.error) throw settingsRes.error;
  return {
    clients: clientsRes.data || [],
    expenses: expensesRes.data || [],
    overrides: overridesRes.data || [],
    settings: settingsRes.data || { saldo_inicial: 0, data_saldo_inicial: yearStart },
  };
}

const REVENUE_PRODUCTS = new Set(["hefsys", "consultoria-clix", "plataformas"]);

function projectClientEntries(clients: any[], year: number): CashEntry[] {
  const out: CashEntry[] = [];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  for (let m = 0; m < 12; m++) {
    // Não projetar receita de cliente em meses passados — usar apenas overrides/lançamentos reais
    if (year < currentYear || (year === currentYear && m < currentMonth)) continue;
    const monthStart = new Date(year, m, 1);
    const monthEnd = new Date(year, m + 1, 0);
    for (const c of clients) {
      if (!REVENUE_PRODUCTS.has(c.product_id)) continue;
      const dia = Number(c.dia_pagamento) || 5;
      const day = clampDay(year, m, dia);
      const date = toISO(year, m, day);
      if (c.product_id === "hefsys") {
        const v = Number(c.faturamento || 0);
        if (v > 0) out.push({ id: `cli-${c.id}-${date}`, tipo: "receita", date, nome: c.nome, categoria: c.product_id, valor: v, origemTipo: "cliente", origemId: c.id });
      } else if (c.product_id === "plataformas") {
        const di = c.data_implementacao ? new Date(c.data_implementacao + "T00:00:00") : null;
        // implementação no mês exato
        if (di && di >= monthStart && di <= monthEnd) {
          const v = Number(c.valor_implementacao || 0);
          if (v > 0) {
            const dateImpl = c.data_implementacao;
            out.push({ id: `cli-impl-${c.id}-${dateImpl}`, tipo: "receita", date: dateImpl, nome: `${c.nome} (implementação)`, categoria: c.product_id, valor: v, origemTipo: "cliente", origemId: c.id });
          }
        }
        // mensalidade no dia_pagamento, somente nos meses APÓS o da implementação
        if (c.tem_mensalidade) {
          const v = Number(c.valor_mensalidade || 0);
          const mensActive = di ? (di < monthStart || (di.getFullYear() === year && di.getMonth() < m)) : false;
          if (v > 0 && mensActive) {
            out.push({ id: `cli-mens-${c.id}-${date}`, tipo: "receita", date, nome: `${c.nome} (mensalidade)`, categoria: c.product_id, valor: v, origemTipo: "cliente", origemId: c.id });
          }
        }
      } else if (c.product_id === "consultoria-clix") {
        const v = Number(c.valor_contrato || 0);
        if (v > 0) out.push({ id: `cli-${c.id}-${date}`, tipo: "receita", date, nome: c.nome, categoria: c.product_id, valor: v, origemTipo: "cliente", origemId: c.id });
      }
    }
  }
  return out;
}

function projectExpenseEntries(expenses: any[], year: number): CashEntry[] {
  const out: CashEntry[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStartStr = toISO(year, m, 1);
    const monthEndStr = toISO(year, m, new Date(year, m + 1, 0).getDate());
    for (const e of expenses) {
      const ds = e.data_inicio as string;
      const df = (e.data_fim as string | null) || null;
      if (ds > monthEndStr) continue;
      if (df && df < monthStartStr) continue;
      if (e.recorrencia === "unica" && (ds < monthStartStr || ds > monthEndStr)) continue;
      const day = e.ultimo_dia_util ? lastBusinessDay(year, m) : clampDay(year, m, Number(e.dia_pagamento) || 5);
      const date = toISO(year, m, day);
      const v = Number(e.valor || 0);
      if (v <= 0) continue;
      out.push({
        id: `exp-${e.id}-${date}`,
        tipo: "despesa",
        date,
        nome: e.nome,
        categoria: e.categoria || "outros",
        valor: v,
        origemTipo: "despesa",
        origemId: e.id,
      });
    }
  }
  return out;
}

function applyOverrides(base: CashEntry[], overrides: any[]): CashEntry[] {
  const result: CashEntry[] = [];
  const replacedKeys = new Set<string>();
  const overrideAvulsos: CashEntry[] = [];
  for (const o of overrides) {
    const date = o.data as string;
    const yyyymm = date.slice(0, 7);
    if (o.origem_id && o.origem_tipo && o.origem_tipo !== "avulso") {
      replacedKeys.add(`${o.origem_tipo}-${o.origem_id}-${yyyymm}`);
    }
    if (!o.origem_id || o.origem_tipo === "avulso") {
      if (Number(o.valor || 0) > 0) {
        overrideAvulsos.push({
          id: `ovr-${o.id}`,
          tipo: o.tipo,
          date,
          nome: o.nome,
          categoria: o.categoria || "outros",
          valor: Number(o.valor),
          origemTipo: "avulso",
          origemId: null,
          overrideId: o.id,
        });
      }
    } else {
      // substituição: criar entrada no lugar (se valor > 0); valor 0 = zera o mês
      if (Number(o.valor || 0) > 0) {
        overrideAvulsos.push({
          id: `ovr-${o.id}`,
          tipo: o.tipo,
          date,
          nome: o.nome,
          categoria: o.categoria || "outros",
          valor: Number(o.valor),
          origemTipo: o.origem_tipo,
          origemId: o.origem_id,
          overrideId: o.id,
        });
      }
    }
  }
  for (const e of base) {
    const yyyymm = e.date.slice(0, 7);
    const key = `${e.origemTipo}-${e.origemId}-${yyyymm}`;
    if (!replacedKeys.has(key)) result.push(e);
  }
  return [...result, ...overrideAvulsos];
}

export interface MonthSummary {
  month: number;            // 0-11
  receitas: number;
  despesas: number;
  investimentos: number;
  aportes: number;
  retiradas: number;
  resultadoOperacional: number;
  resultado: number;
  saldoFinal: number;
  byCategoryReceita: Record<string, number>;
  byCategoryDespesa: Record<string, number>;
  byCategoryInvest: Record<string, number>;
  byCategorySocio: Record<string, number>;
  entries: CashEntry[];
}

export interface CashFlowYearData {
  year: number;
  saldoInicial: number;
  months: MonthSummary[];
  totalReceitas: number;
  totalDespesas: number;
  totalInvestimentos: number;
  totalAportes: number;
  totalRetiradas: number;
  totalResultadoOperacional: number;
  totalResultado: number;
  entries: CashEntry[];
}

export function useCashFlowYear(year: number, enabled: boolean) {
  return useQuery({
    queryKey: ["cash-flow", year],
    enabled,
    queryFn: async (): Promise<CashFlowYearData> => {
      const { clients, expenses, overrides, settings } = await fetchAll(year);
      const baseClientEntries = projectClientEntries(clients as any[], year);
      const baseExpenseEntries = projectExpenseEntries(expenses as any[], year);
      const allEntries = applyOverrides([...baseClientEntries, ...baseExpenseEntries], overrides as any[]);

      const saldoInicial = Number((settings as any)?.saldo_inicial || 0);
      let running = saldoInicial;
      const months: MonthSummary[] = [];
      for (let m = 0; m < 12; m++) {
        const monthEntries = allEntries.filter((e) => {
          const d = new Date(e.date + "T00:00:00");
          return d.getFullYear() === year && d.getMonth() === m;
        });
        let rec = 0, desp = 0, inv = 0, ap = 0, ret = 0;
        const byRec: Record<string, number> = {};
        const byDesp: Record<string, number> = {};
        const byInv: Record<string, number> = {};
        const bySoc: Record<string, number> = {};
        for (const e of monthEntries) {
          const cat = e.categoria || "outros";
          if (e.tipo === "receita") { rec += e.valor; byRec[cat] = (byRec[cat] || 0) + e.valor; }
          else if (e.tipo === "despesa") { desp += e.valor; byDesp[cat] = (byDesp[cat] || 0) + e.valor; }
          else if (e.tipo === "investimento") { inv += e.valor; byInv[cat] = (byInv[cat] || 0) + e.valor; }
          else if (e.tipo === "aporte") { ap += e.valor; bySoc["aporte"] = (bySoc["aporte"] || 0) + e.valor; }
          else if (e.tipo === "retirada") { ret += e.valor; bySoc["retirada"] = (bySoc["retirada"] || 0) + e.valor; }
        }
        const resultadoOperacional = rec - desp;
        const result = resultadoOperacional - inv + ap - ret;
        running += result;
        months.push({
          month: m,
          receitas: rec,
          despesas: desp,
          investimentos: inv,
          aportes: ap,
          retiradas: ret,
          resultadoOperacional,
          resultado: result,
          saldoFinal: running,
          byCategoryReceita: byRec,
          byCategoryDespesa: byDesp,
          byCategoryInvest: byInv,
          byCategorySocio: bySoc,
          entries: monthEntries.sort((a, b) => a.date.localeCompare(b.date)),
        });
      }
      const totalReceitas = months.reduce((s, m) => s + m.receitas, 0);
      const totalDespesas = months.reduce((s, m) => s + m.despesas, 0);
      const totalInvestimentos = months.reduce((s, m) => s + m.investimentos, 0);
      const totalAportes = months.reduce((s, m) => s + m.aportes, 0);
      const totalRetiradas = months.reduce((s, m) => s + m.retiradas, 0);
      const totalResultadoOperacional = totalReceitas - totalDespesas;
      return {
        year,
        saldoInicial,
        months,
        totalReceitas,
        totalDespesas,
        totalInvestimentos,
        totalAportes,
        totalRetiradas,
        totalResultadoOperacional,
        totalResultado: totalResultadoOperacional - totalInvestimentos + totalAportes - totalRetiradas,
        entries: allEntries,
      };
    },
    staleTime: 30000,
  });
}