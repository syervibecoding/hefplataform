import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Investment {
  id: string;
  nome: string;
  instituicao: string | null;
  tipo: string;
  liquidez: string;
  rendimento_anual: number;
  saldo_inicial: number;
  data_inicial: string;
  ativo: boolean;
  notas: string | null;
  aliases: string[];
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  data: string;
  tipo: "aporte" | "resgate" | "rendimento";
  valor: number;
  notas: string | null;
  import_id?: string | null;
}

export const INVESTMENT_TYPES = [
  { id: "cdb", label: "CDB" },
  { id: "lci_lca", label: "LCI/LCA" },
  { id: "tesouro", label: "Tesouro Direto" },
  { id: "fundo", label: "Fundo" },
  { id: "poupanca", label: "Poupança" },
  { id: "outros", label: "Outros" },
];

export const LIQUIDEZ_OPTIONS = [
  { id: "diaria", label: "Diária" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "vencimento", label: "No vencimento" },
];

export function useInvestments(enabled: boolean) {
  const qc = useQueryClient();
  const invQ = useQuery({
    queryKey: ["investments"],
    enabled,
    queryFn: async (): Promise<Investment[]> => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        instituicao: r.instituicao,
        tipo: r.tipo,
        liquidez: r.liquidez,
        rendimento_anual: Number(r.rendimento_anual) || 0,
        saldo_inicial: Number(r.saldo_inicial) || 0,
        data_inicial: r.data_inicial,
        ativo: !!r.ativo,
        notas: r.notas,
        aliases: Array.isArray(r.aliases) ? r.aliases : [],
      }));
    },
  });

  const txQ = useQuery({
    queryKey: ["investment_transactions"],
    enabled,
    queryFn: async (): Promise<InvestmentTransaction[]> => {
      const { data, error } = await supabase
        .from("investment_transactions")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        investment_id: r.investment_id,
        data: r.data,
        tipo: r.tipo,
        valor: Number(r.valor) || 0,
        notas: r.notas,
        import_id: r.import_id ?? null,
      }));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["investments"] });
    qc.invalidateQueries({ queryKey: ["investment_transactions"] });
  };

  const addInvestment = useMutation({
    mutationFn: async (v: Omit<Investment, "id">) => {
      const { data, error } = await supabase.from("investments").insert(v as any).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Investment> }) => {
      const { error } = await supabase.from("investments").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const addTransaction = useMutation({
    mutationFn: async (v: Omit<InvestmentTransaction, "id">) => {
      const { error } = await supabase.from("investment_transactions").insert(v as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investment_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  // Compute current balance per investment: saldo_inicial + sum(aporte+rendimento) - sum(resgate)
  const investments = invQ.data || [];
  const transactions = txQ.data || [];
  const balances = new Map<string, number>();
  for (const inv of investments) balances.set(inv.id, inv.saldo_inicial);
  for (const tx of transactions) {
    const sign = tx.tipo === "resgate" ? -1 : 1;
    balances.set(tx.investment_id, (balances.get(tx.investment_id) || 0) + sign * tx.valor);
  }
  const totalSaldo = Array.from(balances.values()).reduce((s, v) => s + v, 0);

  return {
    investments,
    transactions,
    balances,
    totalSaldo,
    isLoading: invQ.isLoading || txQ.isLoading,
    addInvestment,
    updateInvestment,
    removeInvestment,
    addTransaction,
    removeTransaction,
  };
}