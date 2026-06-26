import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CashExpense {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  dia_pagamento: number;
  ultimo_dia_util: boolean;
  recorrencia: string;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
  aliases: string[];
}

export const EXPENSE_CATEGORIES = [
  { id: "pessoal", label: "Pessoal" },
  { id: "infraestrutura", label: "Infraestrutura" },
  { id: "software", label: "Software & Tecnologia" },
  { id: "marketing", label: "Marketing/Comercial" },
  { id: "educacao", label: "Educação/Eventos" },
  { id: "administrativo", label: "Administrativo" },
  { id: "impostos", label: "Impostos" },
  { id: "outros", label: "Outros" },
];

export function categoryLabel(id: string) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label || id;
}

export function useCashExpenses(enabled: boolean) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cash_expenses"],
    enabled,
    queryFn: async (): Promise<CashExpense[]> => {
      const { data, error } = await supabase
        .from("cash_expenses")
        .select("*")
        .order("categoria")
        .order("nome");
      if (error) throw error;
      return (data || []).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        categoria: r.categoria,
        valor: Number(r.valor) || 0,
        dia_pagamento: Number(r.dia_pagamento) || 5,
        ultimo_dia_util: !!r.ultimo_dia_util,
        recorrencia: r.recorrencia,
        data_inicio: r.data_inicio,
        data_fim: r.data_fim,
        ativo: !!r.ativo,
        aliases: Array.isArray(r.aliases) ? r.aliases : [],
      }));
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cash_expenses"] });
    qc.invalidateQueries({ queryKey: ["cash-flow"] });
  };

  const add = useMutation({
    mutationFn: async (e: Omit<CashExpense, "id">) => {
      const { error } = await supabase.from("cash_expenses").insert(e as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CashExpense> }) => {
      const { error } = await supabase.from("cash_expenses").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { expenses: q.data || [], isLoading: q.isLoading, add, update, remove };
}