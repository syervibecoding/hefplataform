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

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const KIND_LABEL: Record<string, string> = {
  inicio: "Marco",
  plataforma: "Plataforma",
  chamado: "Chamado",
  interacao: "Interação",
};

export function generateClientReportPdf(data: ClientReportPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Cabeçalho
  doc.setFillColor(24, 18, 43);
  doc.rect(0, 0, W, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.titulo || data.clientName, M, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 190, 220);
  const sub =
    data.subtitulo ||
    [
      `Competência ${data.periodoLabel}`,
      data.inicio
        ? `Cliente desde ${format(parseISO(data.inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
        : "Sem data de início",
      data.meses ? `${data.meses} ${data.meses === 1 ? "mês" : "meses"} de parceria` : null,
      data.valorMensal > 0 ? `${brl(data.valorMensal)}/mês` : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
  doc.text(sub, M, 62);
  doc.setFontSize(8);
  const refDate = data.dataReferencia ? parseISO(data.dataReferencia) : new Date();
  doc.text(`Relatório gerado em ${format(refDate, "dd/MM/yyyy")}`, M, 78);

  let y = 122;

  const paragraph = (text: string, top: number) => {
    doc.setTextColor(60, 54, 80);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, W - M * 2);
    doc.text(lines, M, top);
    return top + lines.length * 13 + 14;
  };

  if (data.introducao?.trim()) {
    y = paragraph(data.introducao.trim(), y);
  }

  // KPIs
  const cardW = (W - M * 2 - 12 * (data.kpis.length - 1)) / data.kpis.length;
  data.kpis.forEach((k, i) => {
    const x = M + i * (cardW + 12);
    doc.setDrawColor(228, 224, 236);
    doc.setFillColor(249, 248, 252);
    doc.roundedRect(x, y, cardW, 52, 6, 6, "FD");
    doc.setTextColor(120, 112, 140);
    doc.setFontSize(8);
    doc.text(k.label.toUpperCase(), x + 10, y + 18);
    doc.setTextColor(30, 24, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(k.value, x + 10, y + 40);
    doc.setFont("helvetica", "normal");
  });
  y += 76;

  const sectionTitle = (title: string, top: number) => {
    doc.setTextColor(30, 24, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, M, top);
    doc.setFont("helvetica", "normal");
    return top + 8;
  };

  if (data.plataformas.length) {
    y = sectionTitle("Plataformas entregues", y);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["Plataforma", "Entrega", "Link"]],
      body: data.plataformas.map((p) => [
        p.descricao?.trim() ? `${p.nome}\n${p.descricao.trim()}` : p.nome,
        p.data,
        p.url || "-",
      ]),
      styles: { fontSize: 9, cellPadding: 6, valign: "top", textColor: [40, 34, 60] },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 248, 252] },
      columnStyles: { 1: { cellWidth: 70 }, 2: { cellWidth: 180, fontSize: 7 } },
    });
    y = (doc as any).lastAutoTable.finalY + 26;
  }

  if (data.chamados.length) {
    if (y > 640) {
      doc.addPage();
      y = 60;
    }
    y = sectionTitle(`Chamados atendidos em ${data.periodoLabel}`, y);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["Chamado", "Plataforma", "Categoria", "Status", "Aberto em", "Resolvido em"]],
      body: data.chamados.map((c) => [c.titulo, c.plataforma, c.categoria, c.status, c.aberto, c.resolvido]),
      styles: { fontSize: 8.5, cellPadding: 5, valign: "top", textColor: [40, 34, 60] },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 8.5 },
      alternateRowStyles: { fillColor: [249, 248, 252] },
      columnStyles: {
        1: { cellWidth: 90 },
        2: { cellWidth: 60 },
        3: { cellWidth: 68 },
        4: { cellWidth: 58 },
        5: { cellWidth: 62 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 26;
  }

  if (data.timeline.length) {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    y = sectionTitle(`Linha do tempo de ${data.periodoLabel}`, y);
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [["Data", "Tipo", "Registro"]],
      body: data.timeline.map((t) => [
        format(parseISO(t.date), "dd/MM/yyyy"),
        KIND_LABEL[t.kind] ?? t.kind,
        t.sub ? `${t.title}\n${t.sub}` : t.title,
      ]),
      styles: { fontSize: 9, cellPadding: 6, valign: "top", textColor: [40, 34, 60] },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 248, 252] },
      columnStyles: { 0: { cellWidth: 66 }, 1: { cellWidth: 72 } },
    });
    y = (doc as any).lastAutoTable.finalY + 26;
  }

  if (data.conclusao?.trim()) {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    y = sectionTitle("Conclusão", y) + 8;
    y = paragraph(data.conclusao.trim(), y);
  }

  if (data.portalUrl) {
    if (y > 720) {
      doc.addPage();
      y = 60;
    }
    doc.setDrawColor(228, 224, 236);
    doc.setFillColor(249, 248, 252);
    doc.roundedRect(M, y, W - M * 2, 46, 6, 6, "FD");
    doc.setTextColor(120, 112, 140);
    doc.setFontSize(8);
    doc.text("PORTAL DE CHAMADOS", M + 12, y + 17);
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(9);
    doc.text(data.portalUrl, M + 12, y + 33);
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 145, 165);
    doc.text(`${i} / ${pages}`, W - M, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  const slug = data.clientName.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
  doc.save(`relatorio-${slug}-${data.periodoRef}.pdf`);
}
