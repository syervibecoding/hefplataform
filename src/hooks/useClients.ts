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
      diasExecucao: row.dias_execucao || [],
      faturamento: Number(row.faturamento) || 0,
      custoAPI: Number(row.custo_api) || 0,
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
        row.dias_execucao = clientData.diasExecucao;
        row.faturamento = clientData.faturamento;
        row.custo_api = clientData.custoAPI;
      } else {
        row.valor_contrato = clientData.valorContrato;
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
        row.dias_execucao = data.diasExecucao;
        row.faturamento = data.faturamento;
        row.custo_api = data.custoAPI;
      } else {
        row.valor_contrato = data.valorContrato;
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
