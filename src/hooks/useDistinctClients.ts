import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DistinctClient {
  nome: string;
  contato: string;
  whatsapp: string;
  email: string;
  status: "ativo" | "inativo";
  productsIn: string[];
  sourceProductId: string;
}

/**
 * Returns a deduplicated list of clients across all products, grouped by
 * normalized name. Each entry exposes the basic fields (to prefill a new
 * client form) and the list of products where this company already exists.
 */
export function useDistinctClients() {
  return useQuery({
    queryKey: ["distinct_clients"],
    queryFn: async (): Promise<DistinctClient[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("nome, contato, whatsapp, email, status, product_id, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;

      const map = new Map<string, DistinctClient>();
      for (const r of data || []) {
        const key = (r.nome || "").trim().toLowerCase();
        if (!key) continue;
        const existing = map.get(key);
        if (existing) {
          if (r.product_id && !existing.productsIn.includes(r.product_id)) {
            existing.productsIn.push(r.product_id);
          }
        } else {
          map.set(key, {
            nome: r.nome,
            contato: r.contato || "",
            whatsapp: r.whatsapp || "",
            email: r.email || "",
            status: (r.status as "ativo" | "inativo") || "ativo",
            productsIn: r.product_id ? [r.product_id] : [],
            sourceProductId: r.product_id || "",
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
    },
    staleTime: 30000,
  });
}