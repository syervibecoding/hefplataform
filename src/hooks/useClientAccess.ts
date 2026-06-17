import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientAccessProfile {
  id: string;
  username: string;
  display_name: string | null;
  platform_company_id: string | null;
}

/** Profiles that belong to platform-portal logins (have platform_company_id set). */
export function useClientAccessProfiles() {
  return useQuery({
    queryKey: ["client_access_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, platform_company_id")
        .not("platform_company_id", "is", null);
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
      platform_company_id: string;
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