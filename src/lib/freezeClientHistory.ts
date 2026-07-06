import { supabase } from "@/integrations/supabase/client";

// Reutiliza a lógica de projeção mínima para congelar meses passados de UM cliente.
// Usa os valores ATUAIS do cliente no banco (antes de qualquer edição).

function clampDay(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function toISO(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function isPastMonth(year: number, month: number, now: Date) {
  if (year < now.getFullYear()) return true;
  if (year > now.getFullYear()) return false;
  return month < now.getMonth();
}

const REVENUE_PRODUCTS = new Set(["hefsys", "consultoria-clix", "plataformas"]);

interface SnapshotRow {
  ano: number;
  mes: number;
  origem_tipo: "cliente";
  origem_id: string;
  sub_kind: string;
  tipo: "receita" | "despesa";
  nome: string;
  categoria: string | null;
  valor: number;
  dia_pagamento: number | null;
  data: string;
}

export async function freezeClientHistory(clientId: string): Promise<void> {
  // Busca cliente
  const { data: c, error } = await supabase
    .from("clients")
    .select("id, nome, product_id, status, valor_contrato, faturamento, valor_implementacao, valor_mensalidade, tem_mensalidade, data_implementacao, dia_pagamento, data_inicio, comissao_percentual, comissao_comercial")
    .eq("id", clientId)
    .maybeSingle();
  if (error || !c) return;
  if (!REVENUE_PRODUCTS.has(c.product_id)) return;

  const now = new Date();
  const startYear = c.data_inicio ? new Date(c.data_inicio + "T00:00:00").getFullYear() : now.getFullYear() - 1;
  const endYear = now.getFullYear();

  // Snapshots existentes para este cliente nesse intervalo
  const { data: existing } = await supabase
    .from("cash_month_snapshots")
    .select("ano, mes, sub_kind")
    .eq("origem_tipo", "cliente")
    .eq("origem_id", clientId)
    .gte("ano", startYear)
    .lte("ano", endYear);
  const existingKeys = new Set((existing || []).map((s: any) => `${s.ano}|${s.mes}|${s.sub_kind || "default"}`));

  const toCreate: SnapshotRow[] = [];
  const dia = Number(c.dia_pagamento) || 5;

  for (let year = startYear; year <= endYear; year++) {
    for (let m = 0; m < 12; m++) {
      if (!isPastMonth(year, m, now)) continue;
      // Respeita data_inicio
      if (c.data_inicio) {
        const di = new Date(c.data_inicio + "T00:00:00");
        if (year < di.getFullYear() || (year === di.getFullYear() && m < di.getMonth())) continue;
      }
      const day = clampDay(year, m, dia);
      const date = toISO(year, m, day);

      const push = (sub_kind: string, valor: number, nome: string, date2: string, tipo: "receita" | "despesa" = "receita", categoria: string | null = c.product_id) => {
        if (valor <= 0) return;
        const key = `${year}|${m}|${sub_kind}`;
        if (existingKeys.has(key)) return;
        toCreate.push({
          ano: year, mes: m, origem_tipo: "cliente", origem_id: c.id, sub_kind,
          tipo, nome, categoria,
          valor, dia_pagamento: dia, data: date2,
        });
      };

      if (c.product_id === "hefsys") {
        push("default", Number(c.faturamento || 0), c.nome, date);
      } else if (c.product_id === "consultoria-clix") {
        const v = Number(c.valor_contrato || 0);
        push("default", v, c.nome, date);
        const pct = Number((c as any).comissao_percentual || 0);
        if (pct > 0) {
          const comissaoValor = +(v * pct / 100).toFixed(2);
          const comercial = ((c as any).comissao_comercial || "").trim();
          const nomeDespesa = `Comissão ${comercial ? comercial + " · " : ""}${c.nome}`;
          push("comissao", comissaoValor, nomeDespesa, date, "despesa", "comissoes");
        }
      } else if (c.product_id === "plataformas") {
        const di = c.data_implementacao ? new Date(c.data_implementacao + "T00:00:00") : null;
        const monthStart = new Date(year, m, 1);
        const monthEnd = new Date(year, m + 1, 0);
        if (di && di >= monthStart && di <= monthEnd) {
          push("implementacao", Number(c.valor_implementacao || 0), `${c.nome} (implementação)`, c.data_implementacao!);
        }
        if (c.tem_mensalidade) {
          const mensActive = di ? (di < monthStart || (di.getFullYear() === year && di.getMonth() < m)) : false;
          if (mensActive) {
            push("mensalidade", Number(c.valor_mensalidade || 0), `${c.nome} (mensalidade)`, date);
          }
        }
      }
    }
  }

  if (toCreate.length > 0) {
    const { error: insErr } = await supabase.from("cash_month_snapshots").insert(toCreate as any);
    if (insErr) console.warn("[freeze] insert:", insErr.message);
  }
}