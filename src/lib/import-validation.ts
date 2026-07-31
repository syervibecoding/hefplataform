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

const BANK_PREFIXES = [
  /^sa[ií]da\s+pix\s+pix\s+enviado\s+para\s+/i,
  /^entrada\s+pix\s+pix\s+recebido\s+de\s+/i,
  /^pix\s+enviado\s+para\s+/i,
  /^pix\s+recebido\s+de\s+/i,
  /^sa[ií]da\s+pix\s+/i,
  /^entrada\s+pix\s+/i,
  /^compra\s+no\s+d[eé]bito\s+/i,
  /^compra\s+com\s+cart[aã]o\s+/i,
  /^pagamento\s+de\s+boleto\s+/i,
  /^pagamento\s+efetuado\s+/i,
  /^d[eé]bito\s+autom[aá]tico\s+/i,
  /^transfer[eê]ncia\s+enviada\s+/i,
  /^transfer[eê]ncia\s+recebida\s+/i,
  /^ted\s+enviada\s+/i,
];

const CORP_SUFFIX = /\s+(ltda|me|epp|s\.?a\.?|eireli|sa)\.?$/i;

/** Limpa prefixos de extrato e sufixos societários da descrição. */
export function cleanBankDescription(s: string): string {
  let out = (s || "").replace(/\s+/g, " ").trim();
  for (const re of BANK_PREFIXES) {
    if (re.test(out)) { out = out.replace(re, "").trim(); break; }
  }
  out = out.replace(/^\*+|\*+$/g, "").trim();
  out = out.replace(CORP_SUFFIX, "").trim();
  return out || (s || "").trim();
}

export function isIOF(descricao: string): boolean {
  return /\biof\b/i.test(descricao || "");
}

const INVESTMENT_KEYWORDS = [
  "CDB", "LCI", "LCA", "RDB", "TESOURO", "APLICACAO", "APLICAÇÃO", "APLIC AUT",
  "APLIC.", "RESGATE", "FUNDO", "POUPANCA", "POUPANÇA", "INVEST", "LIM.GARANT",
  "LIM GARANT", "RENDA FIXA",
];

export interface InvestmentMatch {
  investmentId: string | null;
  matchedTerm: string;
}

export function detectInvestment(
  descricao: string,
  investments: Array<{ id: string; nome: string; aliases?: string[]; ativo?: boolean }>,
): InvestmentMatch | null {
  const desc = (descricao || "").toUpperCase();
  if (!desc) return null;
  for (const inv of investments) {
    if (inv.ativo === false) continue;
    const terms = [inv.nome, ...(inv.aliases || [])].filter(Boolean).map((s) => s.toUpperCase());
    for (const term of terms) {
      if (term.length < 3) continue;
      if (desc.includes(term)) return { investmentId: inv.id, matchedTerm: term };
    }
  }
  for (const kw of INVESTMENT_KEYWORDS) {
    if (desc.includes(kw)) return { investmentId: null, matchedTerm: kw };
  }
  return null;
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