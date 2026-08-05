import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ReportTimelineItem = { date: string; kind: string; title: string; sub?: string };

export type ClientReportPdfData = {
  clientName: string;
  inicio: string | null;
  meses: number | null;
  valorMensal: number;
  kpis: { label: string; value: string }[];
  plataformas: { nome: string; data: string; url?: string | null }[];
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
  doc.text(data.clientName, M, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(200, 190, 220);
  const sub = [
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
  doc.text(`Relatório gerado em ${format(new Date(), "dd/MM/yyyy")}`, M, 78);

  let y = 122;

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
      body: data.plataformas.map((p) => [p.nome, p.data, p.url || "-"]),
      styles: { fontSize: 9, cellPadding: 6, textColor: [40, 34, 60] },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 248, 252] },
      columnStyles: { 1: { cellWidth: 70 }, 2: { cellWidth: 180, fontSize: 7 } },
    });
    y = (doc as any).lastAutoTable.finalY + 26;
  }

  if (data.timeline.length) {
    if (y > 700) {
      doc.addPage();
      y = 60;
    }
    y = sectionTitle("Linha do tempo desde o início do contrato", y);
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
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 145, 165);
    doc.text(`${i} / ${pages}`, W - M, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  const slug = data.clientName.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
  doc.save(`relatorio-${slug}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
