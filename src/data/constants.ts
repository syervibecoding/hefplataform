import { Calculator, Megaphone, Bot, MonitorSmartphone } from "lucide-react";

// ─── Produtos ───
export type ProductId = "hefsys" | "trafego" | "automacao" | "plataformas";

export interface Product {
  id: ProductId;
  nome: string;
  icon: typeof Calculator;
  descricao: string;
}

export const PRODUCTS: Product[] = [
  { id: "hefsys", nome: "HefSys", icon: Calculator, descricao: "Contabilidade" },
  { id: "trafego", nome: "Tráfego Pago", icon: Megaphone, descricao: "Marketing Digital" },
  { id: "automacao", nome: "Automação IA", icon: Bot, descricao: "Automações" },
  { id: "plataformas", nome: "Plataformas IA", icon: MonitorSmartphone, descricao: "Desenvolvimento" },
];

// ─── Consultas HefSys ───
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

// ─── Status Types ───
export type ClientStatus = "ativo" | "inativo";
export type ConsultaStatus = "pendente" | "em_andamento" | "concluido" | "erro" | "nao_executado";
export type MelhoriaStatus = "backlog" | "em_desenvolvimento" | "concluido";

// ─── Client Types ───
export interface BaseClient {
  id: number;
  nome: string;
  contato: string;
  whatsapp: string;
  email: string;
  status: ClientStatus;
}

export interface HefSysClient extends BaseClient {
  cnpjs: number;
  consultas: string[];
  frequencia: string;
  diasExecucao: number[];
}

export interface GenericClient extends BaseClient {
  valorContrato: number;
}

// Keep backward compat
export type Client = HefSysClient;
export type AnyClient = HefSysClient | GenericClient;

export function isHefSysClient(client: AnyClient): client is HefSysClient {
  return "cnpjs" in client;
}

// ─── Melhorias ───
export interface Melhoria {
  id: number;
  titulo: string;
  prioridade: "alta" | "media" | "baixa";
  status: MelhoriaStatus;
  tipo: string;
}

// ─── Initial Data ───
export const INITIAL_HEFSYS_CLIENTS: HefSysClient[] = [
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

export const INITIAL_TRAFEGO_CLIENTS: GenericClient[] = [
  { id: 101, nome: "Loja Bella Moda", contato: "Fernanda Costa", whatsapp: "(81) 98888-0001", email: "fernanda@bellamoda.com", status: "ativo", valorContrato: 3500 },
  { id: 102, nome: "Clínica Sorriso", contato: "Dr. Pedro Lima", whatsapp: "(81) 98888-0002", email: "pedro@clinicasorriso.com", status: "ativo", valorContrato: 5000 },
];

export const INITIAL_AUTOMACAO_CLIENTS: GenericClient[] = [
  { id: 201, nome: "Imobiliária Prime", contato: "Lucas Almeida", whatsapp: "(81) 97777-0001", email: "lucas@prime.com", status: "ativo", valorContrato: 8000 },
];

export const INITIAL_PLATAFORMAS_CLIENTS: GenericClient[] = [
  { id: 301, nome: "EduTech Brasil", contato: "Camila Souza", whatsapp: "(81) 96666-0001", email: "camila@edutech.com", status: "ativo", valorContrato: 15000 },
  { id: 302, nome: "HealthTrack", contato: "Ricardo Neves", whatsapp: "(81) 96666-0002", email: "ricardo@healthtrack.com", status: "inativo", valorContrato: 12000 },
];

export type ClientsByProduct = {
  hefsys: HefSysClient[];
  trafego: GenericClient[];
  automacao: GenericClient[];
  plataformas: GenericClient[];
};

export const INITIAL_CLIENTS_BY_PRODUCT: ClientsByProduct = {
  hefsys: INITIAL_HEFSYS_CLIENTS,
  trafego: INITIAL_TRAFEGO_CLIENTS,
  automacao: INITIAL_AUTOMACAO_CLIENTS,
  plataformas: INITIAL_PLATAFORMAS_CLIENTS,
};

export const INITIAL_MELHORIAS: Melhoria[] = [
  { id: 1, titulo: "Auto-retry em falhas de API", prioridade: "alta", status: "em_desenvolvimento", tipo: "melhoria" },
  { id: 2, titulo: "Dashboard de emissão por cliente", prioridade: "media", status: "backlog", tipo: "feature" },
  { id: 3, titulo: "Notificação automática WhatsApp", prioridade: "alta", status: "em_desenvolvimento", tipo: "feature" },
  { id: 4, titulo: "Relatório comparativo mês a mês", prioridade: "media", status: "backlog", tipo: "melhoria" },
  { id: 5, titulo: "Integração com Google Drive automática", prioridade: "alta", status: "concluido", tipo: "feature" },
];
