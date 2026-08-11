console.log("start");
import jsPDF from "jspdf";
(jsPDF as any).prototype.save = function (name: string) {
  const fs = require("fs");
  fs.writeFileSync("/tmp/pdfq/" + name, Buffer.from(this.output("arraybuffer")));
  console.log("saved", name);
};
import { generateClientReportPdf } from "/dev-server/src/lib/clientReportPdf";

generateClientReportPdf({
  clientName: "Contabilidade Modelo LTDA",
  periodoRef: "2026-07",
  periodoLabel: "julho de 2026",
  titulo: "Contabilidade Modelo LTDA",
  subtitulo: null,
  dataReferencia: "2026-08-01",
  periodoInicio: "2026-07-01",
  periodoFim: "2026-07-31",
  introducao:
    "Este relatório consolida as entregas, chamados atendidos e marcos do mês de julho. A operação seguiu o ritmo semanal acordado, com foco na estabilização das automações fiscais e na ampliação do painel de indicadores.",
  conclusao:
    "Julho encerrou com todas as plataformas em produção e nenhum chamado crítico em aberto. Para agosto, a prioridade é a automação de conciliação bancária e o treinamento da equipe interna.",
  inicio: "2026-02-10",
  meses: 5,
  valorMensal: 5600,
  kpis: [
    { label: "Chamados no mês", value: "12" },
    { label: "Resolvidos", value: "11" },
    { label: "Tempo médio", value: "6h" },
    { label: "Plataformas ativas", value: "4" },
  ],
  plataformas: [
    { nome: "Robô de Domicílio Eletrônico", data: "12/03/2026", url: "https://app.hef.com.br/dom-eletronico", descricao: "Ajuste no parser de intimações e inclusão de 42 novos CNPJs monitorados." },
    { nome: "Painel de BI Contábil", data: "28/05/2026", url: "https://app.hef.com.br/bi-contabil", descricao: "Nova aba de rentabilidade por cliente e exportação em Excel." },
    { nome: "Automação de Guias DAS", data: "02/07/2026", url: null, descricao: "Entrada em produção com emissão automática no dia 15." },
  ],
  chamados: [
    { titulo: "Erro ao gerar guia para CNPJ com filial", plataforma: "Automação de Guias DAS", categoria: "Bug", status: "Resolvido", aberto: "04/07", resolvido: "05/07" },
    { titulo: "Solicitação de novo indicador de margem", plataforma: "Painel de BI Contábil", categoria: "Melhoria", status: "Resolvido", aberto: "09/07", resolvido: "16/07" },
    { titulo: "Intimação não capturada no e-CAC", plataforma: "Robô de Domicílio Eletrônico", categoria: "Bug", status: "Resolvido", aberto: "18/07", resolvido: "18/07" },
    { titulo: "Treinamento da equipe no painel", plataforma: "Painel de BI Contábil", categoria: "Suporte", status: "Em andamento", aberto: "29/07", resolvido: "-" },
  ],
  portalUrl: "https://hefplataform.lovable.app/suporte/p/contabilidade-modelo",
  timeline: [
    { date: "2026-07-02", kind: "plataforma", title: "Automação de Guias DAS em produção", sub: "Go-live após homologação" },
    { date: "2026-07-16", kind: "interacao", title: "Reunião de acompanhamento", sub: "Revisão de indicadores do 1º semestre" },
    { date: "2026-07-31", kind: "chamado", title: "Fechamento do mês", sub: "11 de 12 chamados resolvidos" },
  ],
});
