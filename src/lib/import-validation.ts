import type { FinancialImport, ParsedTransaction } from "@/hooks/useFinancialImports";

export interface ExistingTx {
  id: string;
  data: string;
  tipo: string;
  valor: number;
  nome: string;
  import_id: string | null;
}

export function normalizeDescription(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b\d+\s*\/\s*\d+\b/g, " ") // strip "2/10"
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(normalizeDescription(s).split(" ").filter((t) => t.length >= 3));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  a.forEach((t) => { if (b.has(t)) inter++; });
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function descriptionsMatch(a: string, b: string): boolean {
  const na = normalizeDescription(a);
  const nb = normalizeDescription(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return jaccard(tokens(a), tokens(b)) >= 0.7;
}

export function detectDuplicates(
  rows: ParsedTransaction[],
  existing: ExistingTx[],
): Array<ExistingTx | null> {
  return rows.map((row) => {
    const candidates = existing.filter(
      (e) =>
        e.data === row.data &&
        e.tipo === row.tipo &&
        Math.abs(Number(e.valor) - Number(row.valor)) < 0.005,
    );
    if (candidates.length === 0) return null;
    const match = candidates.find((c) => descriptionsMatch(c.nome, row.descricao));
    return match || null;
  });
}

export interface PeriodOverlap {
  import: FinancialImport;
}

function overlaps(aStart: string | null, aEnd: string | null, bStart: string | null, bEnd: string | null): boolean {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart <= bEnd && bStart <= aEnd;
}

export function findPeriodOverlap(
  imports: FinancialImport[],
  kind: "extrato" | "fatura",
  origem: string | null,
  start: string | null,
  end: string | null,
): FinancialImport[] {
  if (!start || !end) return [];
  const oNorm = (origem || "").toLowerCase();
  return imports.filter((imp) => {
    if (imp.kind !== kind) return false;
    if (oNorm) {
      const src = (imp.source_name || "").toLowerCase();
      if (!src.includes(oNorm)) return false;
    }
    return overlaps(imp.period_start, imp.period_end, start, end);
  });
}

export function exportImportToCsv(
  imp: FinancialImport,
  rows: Array<{ data: string; nome: string; tipo: string; categoria: string | null; valor: number }>,
): void {
  const header = ["Data", "Descricao", "Tipo", "Categoria", "Valor"];
  const csv = [header.join(",")]
    .concat(
      rows.map((r) =>
        [
          r.data,
          `"${(r.nome || "").replace(/"/g, '""')}"`,
          r.tipo,
          r.categoria || "",
          r.valor.toFixed(2).replace(".", ","),
        ].join(","),
      ),
    )
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = (imp.source_name || "importacao").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
  a.download = `${safeName}_${imp.id.slice(0, 8)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}