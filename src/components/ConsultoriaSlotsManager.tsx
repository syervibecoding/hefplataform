import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useConsultants } from "@/hooks/useConsultants";
import { useClientConsultoriaSlots, DIAS_SEMANA_CONS, TURNO_LABEL } from "@/hooks/useConsultoriaSlots";
import { toast } from "sonner";

interface Props {
  clientId: string;
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function ConsultoriaSlotsManager({ clientId }: Props) {
  const { consultants } = useConsultants();
  const { slots, addSlot, updateSlot, deleteSlot } = useClientConsultoriaSlots(clientId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    consultantId: "",
    diaSemana: 2,
    turno: "manha" as "manha" | "tarde",
  });

  const consultantsActive = consultants.filter((c) => c.ativo);
  const cMap = new Map(consultants.map((c) => [c.id, c]));

  const handleAdd = async () => {
    if (!draft.consultantId) {
      toast.error("Selecione um consultor");
      return;
    }
    try {
      await addSlot.mutateAsync({
        clientId,
        consultantId: draft.consultantId,
        diaSemana: draft.diaSemana,
        turno: draft.turno,
        dataInicio: null,
        dataFim: null,
      });
      setAdding(false);
      setDraft({ consultantId: "", diaSemana: 2, turno: "manha" });
      toast.success("Turno adicionado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao adicionar turno");
    }
  };

  // Próximas sessões (8 ocorrências futuras)
  const upcomingSessions = (() => {
    if (slots.length === 0) return [];
    const out: { date: Date; turno: string; consultantName: string; cor: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60 && out.length < 8; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dow = d.getDay();
      slots.forEach((s) => {
        if (s.diaSemana !== dow) return;
        if (s.dataInicio && new Date(s.dataInicio + "T00:00:00") > d) return;
        if (s.dataFim && new Date(s.dataFim + "T00:00:00") < d) return;
        const c = cMap.get(s.consultantId);
        out.push({
          date: new Date(d),
          turno: TURNO_LABEL[s.turno],
          consultantName: c?.displayName || "—",
          cor: c?.cor || "bg-secondary text-foreground border-border",
        });
      });
    }
    return out.slice(0, 8);
  })();

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Turnos contratados (recorrentes)
          </h4>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="text-[11px] px-2 py-1 rounded-md font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Adicionar turno
            </button>
          )}
        </div>

        <div className="space-y-2">
          {slots.length === 0 && !adding && (
            <p className="text-xs text-muted-foreground">Nenhum turno cadastrado.</p>
          )}

          {slots.map((s) => {
            const c = cMap.get(s.consultantId);
            return (
              <div key={s.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
                <div className={`w-3 h-3 rounded ${(c?.cor || "bg-secondary").split(" ")[0]}`} />
                <select
                  value={s.consultantId}
                  onChange={(e) => updateSlot.mutate({ id: s.id, patch: { consultantId: e.target.value } })}
                  className="h-8 text-xs rounded border border-border bg-secondary px-2"
                >
                  {consultantsActive.map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.displayName}</option>
                  ))}
                  {!consultantsActive.some((cc) => cc.id === s.consultantId) && c && (
                    <option value={s.consultantId}>{c.displayName} (inativo)</option>
                  )}
                </select>
                <select
                  value={s.diaSemana}
                  onChange={(e) => updateSlot.mutate({ id: s.id, patch: { diaSemana: Number(e.target.value) } })}
                  className="h-8 text-xs rounded border border-border bg-secondary px-2"
                >
                  {DIAS_SEMANA_CONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <select
                  value={s.turno}
                  onChange={(e) => updateSlot.mutate({ id: s.id, patch: { turno: e.target.value as "manha" | "tarde" } })}
                  className="h-8 text-xs rounded border border-border bg-secondary px-2"
                >
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                </select>
                <div className="flex-1" />
                <button
                  onClick={() => deleteSlot.mutate(s.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {adding && (
            <div className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg">
              <select
                value={draft.consultantId}
                onChange={(e) => setDraft({ ...draft, consultantId: e.target.value })}
                className="h-8 text-xs rounded border border-border bg-secondary px-2 flex-1"
              >
                <option value="">Consultor…</option>
                {consultantsActive.map((cc) => (
                  <option key={cc.id} value={cc.id}>{cc.displayName}</option>
                ))}
              </select>
              <select
                value={draft.diaSemana}
                onChange={(e) => setDraft({ ...draft, diaSemana: Number(e.target.value) })}
                className="h-8 text-xs rounded border border-border bg-secondary px-2"
              >
                {DIAS_SEMANA_CONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <select
                value={draft.turno}
                onChange={(e) => setDraft({ ...draft, turno: e.target.value as "manha" | "tarde" })}
                className="h-8 text-xs rounded border border-border bg-secondary px-2"
              >
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
              </select>
              <button
                onClick={handleAdd}
                className="px-3 h-8 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground hover:brightness-110"
              >
                Salvar
              </button>
              <button
                onClick={() => setAdding(false)}
                className="px-2 h-8 rounded-md text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {consultants.length === 0 && (
          <p className="text-[11px] text-hef-warning mt-2">
            Nenhum consultor cadastrado ainda. Vá na Agenda para cadastrá-los.
          </p>
        )}
      </div>

      {upcomingSessions.length > 0 && (
        <div>
          <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Próximas sessões
          </h4>
          <div className="space-y-1.5">
            {upcomingSessions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg text-xs">
                <span className="font-mono text-muted-foreground w-20">
                  {String(s.date.getDate()).padStart(2, "0")}/{MONTH_NAMES[s.date.getMonth()]}
                </span>
                <span className={`px-2 py-0.5 rounded font-semibold border ${s.cor}`}>
                  {s.consultantName}
                </span>
                <span className="text-muted-foreground">· {s.turno}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}