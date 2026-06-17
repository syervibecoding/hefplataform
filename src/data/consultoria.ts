export type EntregaStatus =
  | "planejado"
  | "em_desenvolvimento"
  | "em_validacao"
  | "em_producao";

export const ENTREGA_STATUS_LABEL: Record<EntregaStatus, string> = {
  planejado: "Planejado",
  em_desenvolvimento: "Desenvolv.",
  em_validacao: "Validação",
  em_producao: "Em Produção",
};

export interface Marco {
  id: string;
  data: string; // YYYY-MM-DD
  titulo: string;
  descricao: string;
}

export interface Entrega {
  id: string;
  titulo: string;
  descricao: string;
  status: EntregaStatus;
}

export interface RelatorioConsultoria {
  marcos: Marco[];
  entregas: Entrega[];
}

export interface ConsultoriaClient {
  id: string;
  nome: string;
  tipoConsultoria: string;
  dataInicio: string; // YYYY-MM-DD
  relatorio: RelatorioConsultoria;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function novoMarco(data = "", titulo = "", descricao = ""): Marco {
  return { id: uid(), data, titulo, descricao };
}

export function novaEntrega(
  titulo = "",
  descricao = "",
  status: EntregaStatus = "planejado"
): Entrega {
  return { id: uid(), titulo, descricao, status };
}

export function novoCliente(
  nome: string,
  tipoConsultoria: string,
  dataInicio: string
): ConsultoriaClient {
  return {
    id: uid(),
    nome,
    tipoConsultoria,
    dataInicio,
    relatorio: { marcos: [], entregas: [] },
  };
}

export const SEED_CONSULTORIA_CLIENTS: ConsultoriaClient[] = [
  {
    id: "correta",
    nome: "Correta Contabilidade",
    tipoConsultoria: "Consultoria em IA",
    dataInicio: "2026-03-23",
    relatorio: {
      marcos: [
        {
          id: "m1",
          data: "2026-03-23",
          titulo: "Início da consultoria",
          descricao: "Kickoff oficial e levantamento de processos.",
        },
        {
          id: "m2",
          data: "2026-04-16",
          titulo: "Primeiro envio de entregas",
          descricao: "Dashboard DRE e Relatório Financeiro para validação.",
        },
        {
          id: "m3",
          data: "2026-04-20",
          titulo: "Ajustes + eCAC",
          descricao: "Refinamentos solicitados e início da automação do eCAC.",
        },
        {
          id: "m4",
          data: "2026-04-30",
          titulo: "Agente IA + NFe",
          descricao: "Agente informativo em produção e início do módulo de NFe.",
        },
      ],
      entregas: [
        {
          id: "e1",
          titulo: "Dashboard DRE",
          descricao: "Painel consolidado da Demonstração de Resultado.",
          status: "em_validacao",
        },
        {
          id: "e2",
          titulo: "Relatório Financeiro",
          descricao: "Relatório mensal de performance financeira.",
          status: "em_validacao",
        },
        {
          id: "e3",
          titulo: "Agente IA Informativo",
          descricao: "Bot interno que responde dúvidas operacionais da equipe.",
          status: "em_producao",
        },
        {
          id: "e4",
          titulo: "Automação eCAC",
          descricao: "Consulta automática de caixa postal e situação fiscal.",
          status: "em_producao",
        },
        {
          id: "e5",
          titulo: "Comparação Convenção",
          descricao: "Comparativo automático de convenções coletivas.",
          status: "em_producao",
        },
        {
          id: "e6",
          titulo: "Não Conformidade",
          descricao: "Fluxo de registro e tratamento de não conformidades.",
          status: "em_desenvolvimento",
        },
        {
          id: "e7",
          titulo: "Consulta NFSe",
          descricao: "Coleta automatizada de notas de serviço.",
          status: "em_desenvolvimento",
        },
        {
          id: "e8",
          titulo: "Análise Acumuladores",
          descricao: "Verificação periódica dos acumuladores fiscais.",
          status: "em_desenvolvimento",
        },
        {
          id: "e9",
          titulo: "Certidões Negativas",
          descricao: "Emissão e monitoramento das certidões negativas.",
          status: "planejado",
        },
      ],
    },
  },
];