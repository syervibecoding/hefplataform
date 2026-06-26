import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantConversation {
  id: string;
  user_id: string;
  title: string;
  messages: AssistantMessage[];
  created_at: string;
  updated_at: string;
  author_username?: string | null;
}

export function useRecentAssistantConversations(limit = 3, enabled = true) {
  return useQuery({
    queryKey: ["assistant-conversations", "recent", limit],
    enabled,
    queryFn: async (): Promise<AssistantConversation[]> => {
      const { data, error } = await supabase
        .from("assistant_conversations")
        .select("id,user_id,title,messages,created_at,updated_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const rows = (data || []) as any[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      let nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,username,display_name")
          .in("id", userIds);
        for (const p of (profs || []) as any[]) {
          nameMap[p.id] = p.display_name || p.username || "—";
        }
      }
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        messages: Array.isArray(r.messages) ? (r.messages as AssistantMessage[]) : [],
        created_at: r.created_at,
        updated_at: r.updated_at,
        author_username: nameMap[r.user_id] || null,
      }));
    },
    staleTime: 15000,
  });
}

export function useSaveAssistantConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string | null;
      title: string;
      messages: AssistantMessage[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado.");
      if (input.id) {
        const { data, error } = await supabase
          .from("assistant_conversations")
          .update({ messages: input.messages as any, title: input.title })
          .eq("id", input.id)
          .select("id")
          .single();
        if (error) throw error;
        return data.id as string;
      }
      const { data, error } = await supabase
        .from("assistant_conversations")
        .insert({
          user_id: user.id,
          title: input.title,
          messages: input.messages as any,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assistant-conversations"] });
    },
  });
}