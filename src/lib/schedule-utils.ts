import { type ScheduleConfig, DIAS_SEMANA_LABELS } from "@/data/constants";

/**
 * Get all execution days for a given schedule config in a specific month/year.
 * Returns adjusted days (weekends → next Monday).
 */
export function getScheduleDays(
  config: ScheduleConfig,
  year: number,
  month: number
): number[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result = new Set<number>();

  // Specific days of month
  if (config.dias) {
    for (const day of config.dias) {
      if (day >= 1 && day <= daysInMonth) {
        result.add(adjustForWeekend(year, month, day));
      }
    }
  }

  // Day of week (every occurrence in the month)
  if (config.diaSemana !== undefined) {
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow === config.diaSemana) {
        result.add(d);
      }
    }
  }

  // First business day
  if (config.primeiroDiaUtil) {
    result.add(getFirstBusinessDay(year, month));
  }

  // Last business day
  if (config.ultimoDiaUtil) {
    result.add(getLastBusinessDay(year, month));
  }

  // Apply month-specific overrides
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const overrides = config.overrides?.[monthKey];
  if (overrides) {
    const finalDays = new Set<number>();
    for (const day of result) {
      const overrideTarget = overrides[String(day)];
      if (overrideTarget !== undefined) {
        finalDays.add(overrideTarget);
      } else {
        finalDays.add(day);
      }
    }
    return Array.from(finalDays).sort((a, b) => a - b);
  }

  return Array.from(result).sort((a, b) => a - b);
}

function adjustForWeekend(year: number, month: number, day: number): number {
  const totalDays = new Date(year, month + 1, 0).getDate();
  let d = Math.min(day, totalDays);
  const dow = new Date(year, month, d).getDay();
  if (dow === 6) d += 2; // Sábado → Segunda
  if (dow === 0) d += 1; // Domingo → Segunda
  if (d > totalDays) d = totalDays;
  return d;
}

function getFirstBusinessDay(year: number, month: number): number {
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= totalDays; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) return d;
  }
  return 1;
}

function getLastBusinessDay(year: number, month: number): number {
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let d = totalDays; d >= 1; d--) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) return d;
  }
  return totalDays;
}

/** Human-readable label for a schedule config */
export function scheduleLabel(config: ScheduleConfig): string {
  const parts: string[] = [];
  if (config.primeiroDiaUtil) parts.push("1º dia útil");
  if (config.ultimoDiaUtil) parts.push("Último dia útil");
  if (config.dias && config.dias.length > 0) parts.push(`dias ${config.dias.join(", ")}`);
  if (config.diaSemana !== undefined) parts.push(`toda ${DIAS_SEMANA_LABELS[config.diaSemana]}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/** Get next execution day from today */
export function getNextScheduleDay(config: ScheduleConfig, year: number, month: number): number | null {
  const days = getScheduleDays(config, year, month);
  const today = new Date().getDate();
  return days.find((d) => d >= today) || days[0] || null;
}
