import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type ProductId, type HefSysClient, type GenericClient, type AnyClient } from "@/data/constants";

function mapRowToClient(row: any, productId: ProductId): AnyClient {
  if (productId === "hefsys") {
    return {
      id: row.id,
      nome: row.nome,
      contato: row.contato,
      whatsapp: row.whatsapp,
      email: row.email,
      status: row.status,
      cnpjs: row.cnpjs || 0,
      consultas: row.consultas || [],
      frequencia: row.frequencia || "1x",
      agendaCertidoes: row.agenda_certidoes || {},
      agendaCaixasPostais: row.agenda_caixas_postais || {},
      faturamento: Number(row.faturamento) || 0,
      custoAPI: Number(row.custo_api) || 0,
      consultasExtras: Array.isArray(row.consultas_extras) ? row.consultas_extras : [],
      diaPagamento: Number(row.dia_pagamento) || 5,
    } as HefSysClient;
  }
  return {
    id: row.id,
    nome: row.nome,
    contato: row.contato,
    whatsapp: row.whatsapp,
    email: row.email,
    status: row.status,
    valorContrato: Number(row.valor_contrato) || 0,
    diaPagamento: Number(row.dia_pagamento) || 5,
    rotinaConferencia: row.rotina_conferencia || {},
    formaPagamento: row.forma_pagamento || null,
    saldoAnuncio: Number(row.saldo_anuncio) || 0,
    gastoDiarioMedio: Number(row.gasto_diario_medio) || 0,
    dataDeposito: row.data_deposito || null,
    dataKickoff: row.data_kickoff || null,
    dataGoLive: row.data_golive || null,
    nivelDificuldade: row.nivel_dificuldade || null,
    notasAutomacao: row.notas_automacao || null,
    nomePlataforma: row.nome_plataforma || null,
    tipoPlataforma: row.tipo_plataforma || null,
    valorImplementacao: Number(row.valor_implementacao) || 0,
    dataImplementacao: row.data_implementacao || null,
    temMensalidade: !!row.tem_mensalidade,
    valorMensalidade: Number(row.valor_mensalidade) || 0,
  } as GenericClient;
}

export function useClients(productId: ProductId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clients", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any) => mapRowToClient(row, productId));
    },
  });

  const addClient = useMutation({
    mutationFn: async (clientData: any) => {
      const row: any = {
        product_id: productId,
        nome: clientData.nome,
        contato: clientData.contato,
        whatsapp: clientData.whatsapp,
        email: clientData.email,
        status: clientData.status,
      };
      if (productId === "hefsys") {
        row.cnpjs = clientData.cnpjs;
        row.consultas = clientData.consultas;
        row.frequencia = clientData.frequencia;
        row.agenda_certidoes = clientData.agendaCertidoes;
        row.agenda_caixas_postais = clientData.agendaCaixasPostais;
        row.faturamento = clientData.faturamento;
        row.custo_api = clientData.custoAPI;
        row.consultas_extras = clientData.consultasExtras || [];
        row.dia_pagamento = Number(clientData.diaPagamento) || 5;
      } else {
        row.valor_contrato = clientData.valorContrato;
        row.dia_pagamento = Number(clientData.diaPagamento) || 5;
        row.rotina_conferencia = clientData.rotinaConferencia;
        row.forma_pagamento = clientData.formaPagamento;
        row.saldo_anuncio = clientData.saldoAnuncio;
        row.gasto_diario_medio = clientData.gastoDiarioMedio;
        row.data_deposito = clientData.dataDeposito;
        row.data_kickoff = clientData.dataKickoff || null;
        row.data_golive = clientData.dataGoLive || null;
        row.nivel_dificuldade = clientData.nivelDificuldade || null;
        row.notas_automacao = clientData.notasAutomacao || null;
        row.nome_plataforma = clientData.nomePlataforma || null;
        row.tipo_plataforma = clientData.tipoPlataforma || null;
        if (productId === "plataformas") {
          row.valor_implementacao = clientData.valorImplementacao || 0;
          row.data_implementacao = clientData.dataImplementacao || null;
          row.tem_mensalidade = !!clientData.temMensalidade;
          row.valor_mensalidade = clientData.temMensalidade ? (clientData.valorMensalidade || 0) : 0;
        }
      }
      const { error } = await supabase.from("clients").insert(row);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", productId] }),
  });

  const editClient = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const row: any = {
        nome: data.nome,
        contato: data.contato,
        whatsapp: data.whatsapp,
        email: data.email,
        status: data.status,
      };
      if (productId === "hefsys") {
        row.cnpjs = data.cnpjs;
        row.consultas = data.consultas;
        row.frequencia = data.frequencia;
        row.agenda_certidoes = data.agendaCertidoes;
        row.agenda_caixas_postais = data.agendaCaixasPostais;
        row.faturamento = data.faturamento;
        row.custo_api = data.custoAPI;
        row.consultas_extras = data.consultasExtras || [];
        row.dia_pagamento = Number(data.diaPagamento) || 5;
      } else {
        row.valor_contrato = data.valorContrato;
        row.dia_pagamento = Number(data.diaPagamento) || 5;
        row.rotina_conferencia = data.rotinaConferencia;
        row.forma_pagamento = data.formaPagamento;
        row.saldo_anuncio = data.saldoAnuncio;
        row.gasto_diario_medio = data.gastoDiarioMedio;
        row.data_deposito = data.dataDeposito;
        row.data_kickoff = data.dataKickoff || null;
        row.data_golive = data.dataGoLive || null;
        row.nivel_dificuldade = data.nivelDificuldade || null;
        row.notas_automacao = data.notasAutomacao || null;
        row.nome_plataforma = data.nomePlataforma || null;
        row.tipo_plataforma = data.tipoPlataforma || null;
        if (productId === "plataformas") {
          row.valor_implementacao = data.valorImplementacao || 0;
          row.data_implementacao = data.dataImplementacao || null;
          row.tem_mensalidade = !!data.temMensalidade;
          row.valor_mensalidade = data.temMensalidade ? (data.valorMensalidade || 0) : 0;
        }
      }
      const { error } = await supabase.from("clients").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", productId] }),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients", productId] }),
  });

  return {
    clients: query.data || [],
    isLoading: query.isLoading,
    addClient,
    editClient,
    deleteClient,
  };
}

export function useAllHefSysClients() {
  return useQuery({
    queryKey: ["clients", "hefsys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("product_id", "hefsys")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row: any) => mapRowToClient(row, "hefsys")) as HefSysClient[];
    },
  });
}
