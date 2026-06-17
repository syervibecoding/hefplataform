import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientAccessProfile {
  id: string;
  username: string;
  display_name: string | null;
  client_id: string | null;
}

/** Profiles that belong to client logins (have client_id set). */
export function useClientAccessProfiles() {
  return useQuery({
    queryKey: ["client_access_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, client_id")
        .not("client_id", "is", null);
      if (error) throw error;
      return (data || []) as ClientAccessProfile[];
    },
  });
}

export function useCreateClientAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      password: string;
      display_name?: string;
      client_id: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-client-user", {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_access_profiles"] });
    },
  });
}