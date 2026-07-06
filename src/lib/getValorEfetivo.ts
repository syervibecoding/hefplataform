export interface ValueAdjustment {
  data_inicio: string; // YYYY-MM-DD
  novo_valor: number;
}

function endOfMonthISO(year: number, month: number): string {
  const last = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(last).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Retorna o valor efetivo para (year, month), considerando reajustes cronológicos.
 * Se houver um ou mais reajustes com data_inicio <= último dia do mês, usa o mais recente.
 * Caso contrário, retorna baseValue.
 */
export function getValorEfetivo(
  baseValue: number,
  adjustments: ValueAdjustment[] | undefined,
  year: number,
  month: number,
): number {
  if (!adjustments || adjustments.length === 0) return baseValue;
  const cutoff = endOfMonthISO(year, month);
  let best: ValueAdjustment | null = null;
  for (const a of adjustments) {
    if (a.data_inicio <= cutoff) {
      if (!best || a.data_inicio > best.data_inicio) best = a;
    }
  }
  return best ? Number(best.novo_valor) : baseValue;
}