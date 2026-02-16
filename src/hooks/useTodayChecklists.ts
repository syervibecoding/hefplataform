import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type StepInfo, isStepDone, getStepInfo, getCustomSteps } from "./useClientChecklist";
import { format } from "date-fns";

export interface ClientChecklistStatus {
  clientId: string;
  clientName: string;
  totalSteps: number;
  doneSteps: number;
  users: { username: string; at: string }[];
  status: "completo" | "parcial" | "pendente" | "sem_execucao";
}

interface ClientInfo {
  id: string;
  nome: string;
}

export function useTodayChecklists(clients: ClientInfo[], enabled: boolean) {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["today-checklists", today, clients.map((c) => c.id)],
    enabled: enabled && clients.length > 0,
    queryFn: async (): Promise<ClientChecklistStatus[]> => {
      const clientIds = clients.map((c) => c.id);

      // Fetch all checklist records for today
      const { data: checklists, error: clError } = await supabase
        .from("client_checklists")
        .select("*")
        .eq("periodo", today)
        .in("client_id", clientIds);
      if (clError) throw clError;

      // Fetch all checklist step templates
      const { data: stepTemplates, error: stError } = await supabase
        .from("checklist_steps")
        .select("*")
        .order("position", { ascending: true });
      if (stError) throw stError;

      const certidoesSteps = (stepTemplates || []).filter((s) => s.tipo === "certidoes");
      const caixasSteps = (stepTemplates || []).filter((s) => s.tipo === "caixas_postais");

      const results: ClientChecklistStatus[] = clients.map((client) => {
        const clientChecklists = (checklists || []).filter((cl) => cl.client_id === client.id);

        if (clientChecklists.length === 0) {
          return {
            clientId: client.id,
            clientName: client.nome,
            totalSteps: 0,
            doneSteps: 0,
            users: [],
            status: "sem_execucao" as const,
          };
        }

        let totalSteps = 0;
        let doneSteps = 0;
        const usersMap = new Map<string, { username: string; at: string }>();

        for (const cl of clientChecklists) {
          const steps = (cl.steps as Record<string, any>) || {};
          const templateSteps = cl.tipo === "certidoes" ? certidoesSteps : caixasSteps;
          const customSteps = getCustomSteps(steps);

          const allStepIds = [
            ...templateSteps.map((s) => s.id),
            ...customSteps.map((s) => s.id),
          ];

          totalSteps += allStepIds.length;

          for (const stepId of allStepIds) {
            const val = steps[stepId];
            if (isStepDone(val)) {
              doneSteps++;
              const info = getStepInfo(val);
              if (info?.username && info.at && !usersMap.has(info.username)) {
                usersMap.set(info.username, { username: info.username, at: info.at });
              }
            }
          }
        }

        const status: ClientChecklistStatus["status"] =
          totalSteps === 0
            ? "sem_execucao"
            : doneSteps === totalSteps
              ? "completo"
              : doneSteps > 0
                ? "parcial"
                : "pendente";

        return {
          clientId: client.id,
          clientName: client.nome,
          totalSteps,
          doneSteps,
          users: Array.from(usersMap.values()),
          status,
        };
      });

      return results;
    },
    staleTime: 30000,
  });
}
