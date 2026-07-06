// ─── Produtos ───
// ProductId is now a dynamic string (products come from DB)
export type ProductId = string;

// ─── Consultas HefSys ───
export const CONSULTAS_CERTIDOES = [
  { id: "cnd_federal", nome: "CND Federal (PGFN)", custo: 0.26, tipo: "certidao" as const },
  { id: "crf_fgts", nome: "CRF FGTS", custo: 0.26, tipo: "certidao" as const },
  { id: "cndt_trab", nome: "CNDT Trabalhista", custo: 0.28, tipo: "certidao" as const },
  { id: "cnd_estadual", nome: "CND Estadual (SEFAZ)", custo: 0.24, tipo: "certidao" as const },
  { id: "cnd_municipal", nome: "CND Municipal", custo: 0.20, tipo: "certidao" as const },
  { id: "ecac_situacao", nome: "ECAC Situação Fiscal", custo: 0.28, tipo: "certidao" as const },
];

export const CONSULTAS_CAIXAS = [
  { id: "ecac_caixa", nome: "ECAC Caixa Postal", custo: 0.28, tipo: "caixa_postal" as const },
  { id: "dte_efisco", nome: "DTE (e-Fisco)", custo: 0.40, tipo: "caixa_postal" as const },
  { id: "det_trab", nome: "DET (Trabalhista)", custo: 0.40, tipo: "caixa_postal" as const },
  { id: "cred_sefaz", nome: "Credenciamentos SEFAZ", custo: 0.40, tipo: "caixa_postal" as const },
];

export const TODAS_CONSULTAS = [...CONSULTAS_CERTIDOES, ...CONSULTAS_CAIXAS];

export const FREQUENCIAS = [
  { id: "1x", label: "1x/mês", vezes: 1 },
  { id: "2x", label: "2x/mês", vezes: 2 },
  { id: "4x", label: "4x/mês", vezes: 4 },
];

// ─── Status Types ───
export type ClientStatus = "ativo" | "inativo";
export type ConsultaStatus = "pendente" | "em_andamento" | "concluido" | "erro" | "nao_executado";
export type MelhoriaStatus = "backlog" | "em_desenvolvimento" | "concluido";

// ─── Client Types ───
export interface BaseClient {
  id: string;
  nome: string;
  contato: string;
  whatsapp: string;
  email: string;
  status: ClientStatus;
}

// Schedule config for flexible scheduling
export interface ScheduleConfig {
  dias?: number[];        // specific days of month
  diaSemana?: number;     // 0=Dom..6=Sáb (repeats every week)
  primeiroDiaUtil?: boolean; // first business day of month
  ultimoDiaUtil?: boolean;   // last business day of month
  todosOsDiasUteis?: boolean; // every business day (Mon-Fri)
  overrides?: Record<string, Record<string, number>>; // "YYYY-MM": { "originalDay": newDay }
}

export interface ConsultaExtra {
  id: string;
  nome: string;
  agenda: ScheduleConfig;
}

export const DIAS_SEMANA_LABELS: Record<number, string> = {
  0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira", 3: "Quarta-feira",
  4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado",
};

export interface HefSysClient extends BaseClient {
  cnpjs: number;
  consultas: string[];
  frequencia: string;
  agendaCertidoes: ScheduleConfig;
  agendaCaixasPostais: ScheduleConfig;
  faturamento: number;
  custoAPI: number;
  consultasExtras: ConsultaExtra[];
  diaPagamento?: number;
  dataInicio?: string | null;
}

export interface GenericClient extends BaseClient {
  valorContrato: number;
  diaPagamento?: number;
  dataInicio?: string | null;
  rotinaConferencia?: ScheduleConfig;
  formaPagamento?: string | null;
  saldoAnuncio?: number;
  gastoDiarioMedio?: number;
  dataDeposito?: string | null;
  // Automação IA
  dataKickoff?: string | null;
  dataGoLive?: string | null;
  nivelDificuldade?: "facil" | "medio" | "dificil" | null;
  notasAutomacao?: string | null;
  // Plataformas IA
  nomePlataforma?: string | null;
  tipoPlataforma?: string | null;
  valorImplementacao?: number;
  dataImplementacao?: string | null;
  temMensalidade?: boolean;
  valorMensalidade?: number;
  // Consultoria - comissão comercial
  comissaoPercentual?: number;
  comissaoComercial?: string | null;
}

// Keep backward compat
export type Client = HefSysClient;
export type AnyClient = HefSysClient | GenericClient;

export function isHefSysClient(client: AnyClient): client is HefSysClient {
  return "cnpjs" in client;
}

// ─── Melhorias ───
export interface Melhoria {
  id: string;
  titulo: string;
  prioridade: "alta" | "media" | "baixa";
  status: MelhoriaStatus;
  tipo: string;
}

// Types for backward compat (data now comes from database)
export type ClientsByProduct = {
  hefsys: HefSysClient[];
  trafego: GenericClient[];
  automacao: GenericClient[];
  plataformas: GenericClient[];
};
