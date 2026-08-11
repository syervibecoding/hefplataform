import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ReportTimelineItem = { date: string; kind: string; title: string; sub?: string };

export type ReportTicketRow = {
  titulo: string;
  plataforma: string;
  categoria: string;
  status: string;
  aberto: string;
  resolvido: string;
};

export type ClientReportPdfData = {
  clientName: string;
  periodoRef: string;
  periodoLabel: string;
  titulo?: string | null;
  subtitulo?: string | null;
  dataReferencia?: string | null;
  periodoInicio?: string | null;
  periodoFim?: string | null;
  introducao?: string | null;
  conclusao?: string | null;
  inicio: string | null;
  meses: number | null;
  valorMensal: number;
  kpis: { label: string; value: string }[];
  plataformas: { nome: string; data: string; url?: string | null; descricao?: string | null }[];
  chamados: ReportTicketRow[];
  portalUrl?: string | null;
  timeline: ReportTimelineItem[];
};

/** Paleta oficial Hef */
const BLACK: [number, number, number] = [10, 10, 10];
const CHAR: [number, number, number] = [23, 23, 23];
const LIMA: [number, number, number] = [166, 242, 82];
const BONE: [number, number, number] = [244, 241, 234];
const GREY: [number, number, number] = [120, 120, 120];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const KIND_LABEL: Record<string, string> = {
  inicio: "Marco",
  plataforma: "Plataforma",
  chamado: "Chamado",
  interacao: "Interação",
};

export function buildClientReportPdf(data: ClientReportPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;

  /** Marca: H branco + ponto lima */
  const drawMark = (x: number, y: number, size: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(255, 255, 255);
    doc.text("H", x, y);
    const w = doc.getTextWidth("H");
    doc.setFillColor(...LIMA);
    doc.circle(x + w + size * 0.11, y - size * 0.07, size * 0.1, "F");
  };

  // ── Capa ──────────────────────────────────────────────
  doc.setFillColor(...BLACK);
  doc.rect(0, 0, W, H, "F");

  drawMark(M, 120, 54);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...LIMA);
  doc.text(`RELATÓRIO MENSAL · ${data.periodoLabel.toUpperCase()}`, M, 170);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(data.titulo || data.clientName, W - M * 2);
  doc.text(titleLines, M, 230);

  doc.setFillColor(...LIMA);
  doc.rect(M, 230 + titleLines.length * 36, 64, 4, "F");

  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(200, 200, 195);
  const sub =
    data.subtitulo ||
    [
      data.inicio
        ? `Cliente desde ${format(parseISO(data.inicio), "MMMM 'de' yyyy", { locale: ptBR })}`
        : null,
      data.meses ? `${data.meses} ${data.meses === 1 ? "mês" : "meses"} de parceria` : null,
      data.valorMensal > 0 ? `${brl(data.valorMensal)}/mês` : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
  if (sub) doc.text(doc.splitTextToSize(sub, W - M * 2), M, 270 + titleLines.length * 36);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text("HEF · CONSULTORIA DE IA", M, H - 76);
  const refDate = data.dataReferencia ? parseISO(data.dataReferencia) : new Date();
  doc.text(`EMITIDO EM ${format(refDate, "dd/MM/yyyy")}`, M, H - 60);
  doc.text(data.clientName.toUpperCase(), W - M, H - 60, { align: "right" });

  // ── Conteúdo ──────────────────────────────────────────
  doc.addPage();
  let y = 90;

  const ensure = (need: number) => {
    if (y + need > H - 70) {
      doc.addPage();
      y = 90;
    }
  };

  const paragraph = (text: string, top: number) => {
    doc.setFont("times", "normal");
    doc.setTextColor(...CHAR);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, W - M * 2);
    doc.text(lines, top === y ? M : M, top);
    return top + lines.length * 15 + 16;
  };

  const sectionTitle = (title: string, top: number) => {
    doc.setFillColor(...LIMA);
    doc.rect(M, top - 9, 3, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BLACK);
    doc.text(title.toUpperCase(), M + 12, top);
    return top + 14;
  };

  const tableTheme = {
    styles: { fontSize: 9, cellPadding: 7, valign: "top" as const, textColor: CHAR, font: "helvetica" },
    headStyles: {
      fillColor: BLACK,
      textColor: LIMA,
      fontSize: 8,
      font: "courier" as const,
      fontStyle: "normal" as const,
    },
    alternateRowStyles: { fillColor: BONE },
    tableLineColor: [225, 222, 214] as [number, number, number],
    tableLineWidth: 0.4,
  };

  if (data.introducao?.trim()) {
    y = paragraph(data.introducao.trim(), y);
  }

  // KPIs
  if (data.kpis.length) {
    const cardW = (W - M * 2 - 10 * (data.kpis.length - 1)) / data.kpis.length;
    ensure(60);
    data.kpis.forEach((k, i) => {
      const x = M + i * (cardW + 10);
      doc.setFillColor(...BLACK);
      doc.rect(x, y, cardW, 58, "F");
      doc.setFillColor(...LIMA);
      doc.rect(x, y, cardW, 3, "F");
      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...GREY);
      doc.text(k.label.toUpperCase().slice(0, 22), x + 10, y + 22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.text(k.value, x + 10, y + 46);
    });
    y += 84;
  }

  if (data.plataformas.length) {
    ensure(90);
    y = sectionTitle("Plataformas entregues", y);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["PLATAFORMA", "ENTREGA", "LINK"]],
      body: data.plataformas.map((p) => [
        p.descricao?.trim() ? `${p.nome}\n${p.descricao.trim()}` : p.nome,
        p.data,
        p.url || "-",
      ]),
      ...tableTheme,
      columnStyles: { 1: { cellWidth: 70 }, 2: { cellWidth: 170, fontSize: 7 } },
    });
    y = (doc as any).lastAutoTable.finalY + 30;
  }

  if (data.chamados.length) {
    ensure(90);
    y = sectionTitle(`Chamados atendidos em ${data.periodoLabel}`, y);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["CHAMADO", "PLATAFORMA", "CATEGORIA", "STATUS", "ABERTO", "RESOLVIDO"]],
      body: data.chamados.map((c) => [c.titulo, c.plataforma, c.categoria, c.status, c.aberto, c.resolvido]),
      ...tableTheme,
      styles: { ...tableTheme.styles, fontSize: 8.5, cellPadding: 6 },
      columnStyles: {
        1: { cellWidth: 88 },
        2: { cellWidth: 58 },
        3: { cellWidth: 66 },
        4: { cellWidth: 56 },
        5: { cellWidth: 60 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 30;
  }

  if (data.timeline.length) {
    ensure(90);
    y = sectionTitle(`Linha do tempo de ${data.periodoLabel}`, y);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["DATA", "TIPO", "REGISTRO"]],
      body: data.timeline.map((t) => [
        format(parseISO(t.date), "dd/MM/yyyy"),
        (KIND_LABEL[t.kind] ?? t.kind).toUpperCase(),
        t.sub ? `${t.title}\n${t.sub}` : t.title,
      ]),
      ...tableTheme,
      columnStyles: { 0: { cellWidth: 78, font: "courier", fontSize: 8 }, 1: { cellWidth: 74, font: "courier", fontSize: 8 } },
    });
    y = (doc as any).lastAutoTable.finalY + 30;
  }

  if (data.conclusao?.trim()) {
    ensure(100);
    y = sectionTitle("Conclusão", y) + 8;
    y = paragraph(data.conclusao.trim(), y);
  }

  if (data.portalUrl) {
    ensure(70);
    doc.setFillColor(...BLACK);
    doc.rect(M, y, W - M * 2, 58, "F");
    doc.setFillColor(...LIMA);
    doc.rect(M, y, 3, 58, "F");
    doc.setFont("courier", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text("PORTAL DE CHAMADOS", M + 16, y + 22);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...LIMA);
    doc.text(data.portalUrl, M + 16, y + 42);
    y += 76;
  }

  // Rodapé (a partir da página 2)
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(225, 222, 214);
    doc.setLineWidth(0.5);
    doc.line(M, H - 46, W - M, H - 46);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GREY);
    doc.text(`HEF · CONSULTORIA DE IA · ${data.periodoLabel.toUpperCase()}`, M, H - 32);
    doc.text(`${i - 1} / ${pages - 1}`, W - M, H - 32, { align: "right" });
  }

  const slug = data.clientName.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
  return { doc, filename: `relatorio-hef-${slug}-${data.periodoRef}.pdf` };
}

export function generateClientReportPdf(data: ClientReportPdfData) {
  const { doc, filename } = buildClientReportPdf(data);
  doc.save(filename);
}

export function clientReportPdfDataUri(data: ClientReportPdfData) {
  const { doc } = buildClientReportPdf(data);
  return doc.output("bloburl").toString();
}

export function clientReportPdfArrayBuffer(data: ClientReportPdfData): ArrayBuffer {
  const { doc } = buildClientReportPdf(data);
  return doc.output("arraybuffer");
}
