export const CONSULTAS_CERTIDOES = [
  { id: "cnd_federal", nome: "CND Federal (PGFN)", custo: 0.26, tipo: "certidao" as const },
  { id: "crf_fgts", nome: "CRF FGTS", custo: 0.26, tipo: "certidao" as const },
  { id: "cndt_trab", nome: "CNDT Trabalhista", custo: 0.28, tipo: "certidao" as const },
  { id: "cnd_estadual", nome: "CND Estadual (SEFAZ)", custo: 0.24, tipo: "certidao" as const },
  { id: "cnd_municipal", nome: "CND Municipal", custo: 0.20, tipo: "certidao" as const },
];

export const CONSULTAS_CAIXAS = [
  { id: "ecac_caixa", nome: "ECAC Caixa Postal", custo: 0.28, tipo: "caixa_postal" as const },
  { id: "ecac_situacao", nome: "ECAC Situação Fiscal", custo: 0.28, tipo: "caixa_postal" as const },
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

export type ClientStatus = "ativo" | "inativo";
export type ConsultaStatus = "pendente" | "em_andamento" | "concluido" | "erro" | "nao_executado";
export type MelhoriaStatus = "backlog" | "em_desenvolvimento" | "concluido";

export interface Client {
  id: number;
  nome: string;
  cnpjs: number;
  consultas: string[];
  frequencia: string;
  diasExecucao: number[];
  status: ClientStatus;
  contato: string;
  whatsapp: string;
  email: string;
}

export interface Melhoria {
  id: number;
  titulo: string;
  prioridade: "alta" | "media" | "baixa";
  status: MelhoriaStatus;
  tipo: string;
}

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 1, nome: "Contabilidade Estrela", cnpjs: 45,
    consultas: ["cnd_federal", "crf_fgts", "cndt_trab", "cnd_estadual", "cnd_municipal", "ecac_caixa", "dte_efisco", "det_trab"],
    frequencia: "2x", diasExecucao: [1, 15], status: "ativo",
    contato: "Maria Silva", whatsapp: "(81) 99999-0001", email: "maria@estrela.com.br",
  },
  {
    id: 2, nome: "RSM Contadores", cnpjs: 120,
    consultas: ["cnd_federal", "crf_fgts", "cndt_trab", "cnd_estadual", "cnd_municipal", "ecac_caixa", "ecac_situacao", "dte_efisco", "det_trab", "cred_sefaz"],
    frequencia: "4x", diasExecucao: [1, 8, 15, 22], status: "ativo",
    contato: "Roberto Mendes", whatsapp: "(81) 99999-0002", email: "roberto@rsm.com.br",
  },
  {
    id: 3, nome: "Fiscal Express", cnpjs: 28,
    consultas: ["cnd_federal", "crf_fgts", "cndt_trab", "ecac_caixa", "det_trab"],
    frequencia: "1x", diasExecucao: [5], status: "ativo",
    contato: "Ana Paula", whatsapp: "(81) 99999-0003", email: "ana@fiscalexpress.com.br",
  },
];

export const INITIAL_MELHORIAS: Melhoria[] = [
  { id: 1, titulo: "Auto-retry em falhas de API", prioridade: "alta", status: "em_desenvolvimento", tipo: "melhoria" },
  { id: 2, titulo: "Dashboard de emissão por cliente", prioridade: "media", status: "backlog", tipo: "feature" },
  { id: 3, titulo: "Notificação automática WhatsApp", prioridade: "alta", status: "em_desenvolvimento", tipo: "feature" },
  { id: 4, titulo: "Relatório comparativo mês a mês", prioridade: "media", status: "backlog", tipo: "melhoria" },
  { id: 5, titulo: "Integração com Google Drive automática", prioridade: "alta", status: "concluido", tipo: "feature" },
];
