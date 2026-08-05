import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NavItem {
  id: string;
  page_key: string;
  label: string;
  icon: string;
  position: number;
  visible: boolean;
  admin_only: boolean;
  section: string;
}

export const FALLBACK_NAV_ITEMS: Omit<NavItem, "id">[] = [
  { page_key: "home", label: "Início", icon: "Home", position: 0, visible: true, admin_only: false, section: "main" },
  { page_key: "clients", label: "Clientes", icon: "Users", position: 1, visible: true, admin_only: false, section: "main" },
  { page_key: "calendar", label: "Calendário", icon: "Calendar", position: 2, visible: true, admin_only: false, section: "main" },
  { page_key: "materials", label: "Materiais", icon: "BookOpen", position: 3, visible: true, admin_only: false, section: "main" },
  { page_key: "lovable-products", label: "Gerenciador de Plataformas", icon: "Package", position: 4, visible: true, admin_only: false, section: "main" },
  { page_key: "crm", label: "CRM", icon: "TrendingUp", position: 5, visible: true, admin_only: false, section: "main" },
  { page_key: "melhorias", label: "Melhorias", icon: "Rocket", position: 6, visible: true, admin_only: false, section: "main" },
  { page_key: "assistant", label: "Assistente", icon: "Sparkles", position: 7, visible: true, admin_only: true, section: "footer" },
  { page_key: "financial-imports", label: "Importações", icon: "FileUp", position: 8, visible: true, admin_only: true, section: "footer" },
  { page_key: "users", label: "Usuários", icon: "UserCog", position: 9, visible: true, admin_only: true, section: "footer" },
  { page_key: "settings", label: "Configurações", icon: "Settings", position: 10, visible: true, admin_only: false, section: "footer" },
];

export function useNavItems() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["nav_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nav_items")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data || []) as NavItem[];
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NavItem> }) => {
      const { error } = await supabase.from("nav_items").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nav_items"] }),
  });

  const rows = query.data && query.data.length > 0 ? query.data : (FALLBACK_NAV_ITEMS as NavItem[]);

  return { navItems: rows, isLoading: query.isLoading, updateItem, isFallback: !query.data || query.data.length === 0 };
}

export function useNavLabels() {
  const { navItems } = useNavItems();
  return Object.fromEntries(navItems.map((i) => [i.page_key, i.label])) as Record<string, string>;
}