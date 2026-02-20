import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, GripVertical, AlertTriangle, Eye, Bot } from "lucide-react";
import { type HefSysClient, type GenericClient, type AnyClient, type ScheduleConfig, TODAS_CONSULTAS, FREQUENCIAS, isHefSysClient } from "@/data/constants";
import { getScheduleDays, scheduleLabel } from "@/lib/schedule-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  clients: AnyClient[];
  activeProduct: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isWeekend(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

interface CalendarEvent {
  clientName: string;
  clientId: string;
  consultas: { id: string; nome: string; tipo: string }[];
  color: string;
  eventKey: string;
  originalDay: number;
  tipo: "certidoes" | "caixas" | "conferencia" | "alerta_saldo" | "automacao" | "custom";
  label?: string;
}

const COLORS = [
  "bg-primary/20 text-primary border-primary/30",
  "bg-clix-info/20 text-clix-info border-clix-info/30",
  "bg-clix-magenta/20 text-clix-magenta border-clix-magenta/30",
  "bg-clix-success/20 text-clix-success border-clix-success/30",
  "bg-clix-warning/20 text-clix-warning border-clix-warning/30",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function CalendarPage({ clients, activeProduct }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const saveOverrideMutation = useMutation({
    mutationFn: async ({ clientId, tipo, schedule, originalDay, newDay }: {
      clientId: string; tipo: "certidoes" | "caixas"; schedule: ScheduleConfig; originalDay: number; newDay: number;
    }) => {
      const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      const updatedSchedule: ScheduleConfig = {
        ...schedule,
        overrides: {
          ...(schedule.overrides || {}),
          [monthKey]: {
            ...((schedule.overrides || {})[monthKey] || {}),
            [String(originalDay)]: newDay,
          },
        },
      };
      const col = tipo === "certidoes" ? "agenda_certidoes" : "agenda_caixas_postais";
      const { error } = await supabase.from("clients").update({ [col]: updatedSchedule as any }).eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: () => toast.error("Erro ao salvar movimentação"),
  });

  const prevMonth = () => {
    setCurrentMonth((m) => (m === 0 ? (setCurrentYear((y) => y - 1), 11) : m - 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentMonth((m) => (m === 11 ? (setCurrentYear((y) => y + 1), 0) : m + 1));
    setSelectedDay(null);
  };

  const isHefsysView = activeProduct === "hefsys";
  const isTrafegoView = activeProduct === "trafego";
  const isAutomacaoView = activeProduct === "automacao";

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    const activeClients = clients.filter((c) => c.status === "ativo");
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    if (isHefsysView) {
      const hefsysClients = activeClients.filter(isHefSysClient);
      hefsysClients.forEach((client, idx) => {
        const color = COLORS[idx % COLORS.length];

        const certidoes = client.consultas
          .map((cid) => TODAS_CONSULTAS.find((q) => q.id === cid))
          .filter((q) => q && q.tipo === "certidao")
          .map((q) => ({ id: q!.id, nome: q!.nome, tipo: q!.tipo }));

        const caixas = client.consultas
          .map((cid) => TODAS_CONSULTAS.find((q) => q.id === cid))
          .filter((q) => q && q.tipo === "caixa_postal")
          .map((q) => ({ id: q!.id, nome: q!.nome, tipo: q!.tipo }));

        const buildReverseMap = (schedule: ScheduleConfig) => {
          const reverseMap: Record<number, number> = {};
          const overrides = schedule.overrides?.[monthKey];
          if (overrides) {
            for (const [origStr, newDay] of Object.entries(overrides)) {
              reverseMap[newDay] = parseInt(origStr);
            }
          }
          return reverseMap;
        };

        if (certidoes.length > 0) {
          const schedule = client.agendaCertidoes || {};
          const days = getScheduleDays(schedule, currentYear, currentMonth);
          const reverseMap = buildReverseMap(schedule);
          days.forEach((day) => {
            const ruleDay = reverseMap[day] ?? day;
            const eventKey = `${client.id}-cert-${ruleDay}`;
            if (!map[day]) map[day] = [];
            map[day].push({ clientName: client.nome, clientId: client.id, consultas: [...certidoes], color, eventKey, originalDay: ruleDay, tipo: "certidoes" });
          });
        }

        if (caixas.length > 0) {
          const schedule = client.agendaCaixasPostais || {};
          const days = getScheduleDays(schedule, currentYear, currentMonth);
          const reverseMap = buildReverseMap(schedule);
          days.forEach((day) => {
            const ruleDay = reverseMap[day] ?? day;
            const eventKey = `${client.id}-caixa-${ruleDay}`;
            if (!map[day]) map[day] = [];
            map[day].push({ clientName: client.nome, clientId: client.id, consultas: [...caixas], color, eventKey, originalDay: ruleDay, tipo: "caixas" });
          });
        }

        // Consultas extras
        const extras = (client as any).consultasExtras || [];
        extras.forEach((extra: any) => {
          const schedule = extra.agenda || {};
          const days = getScheduleDays(schedule, currentYear, currentMonth);
          days.forEach((day: number) => {
            if (!map[day]) map[day] = [];
            map[day].push({
              clientName: client.nome,
              clientId: client.id,
              consultas: [],
              color: "bg-clix-success/20 text-clix-success border-clix-success/30",
              eventKey: `${client.id}-${extra.id}-${day}`,
              originalDay: day,
              tipo: "custom",
              label: extra.nome,
            });
          });
        });
      });
    }

    if (isTrafegoView) {
      const trafegoClients = activeClients.filter((c) => !isHefSysClient(c)) as GenericClient[];
      trafegoClients.forEach((client, idx) => {
        const color = COLORS[idx % COLORS.length];

        // Rotina de conferência
        const rotina = client.rotinaConferencia || {};
        if (rotina.dias || rotina.diaSemana !== undefined || rotina.primeiroDiaUtil || rotina.ultimoDiaUtil) {
          const days = getScheduleDays(rotina, currentYear, currentMonth);
          days.forEach((day) => {
            if (!map[day]) map[day] = [];
            map[day].push({
              clientName: client.nome,
              clientId: client.id,
              consultas: [],
              color: "bg-clix-warning/20 text-clix-warning border-clix-warning/30",
              eventKey: `${client.id}-conf-${day}`,
              originalDay: day,
              tipo: "conferencia",
              label: `Conferir Anúncios`,
            });
          });
        }

        // Alerta de saldo PIX
        if (client.formaPagamento === "pix" && client.saldoAnuncio && client.gastoDiarioMedio && client.dataDeposito) {
          const depositDate = new Date(client.dataDeposito + "T00:00:00");
          const diasRestantes = Math.floor(client.saldoAnuncio / client.gastoDiarioMedio);
          const endDate = new Date(depositDate);
          endDate.setDate(endDate.getDate() + diasRestantes);

          if (endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth) {
            const endDay = endDate.getDate();
            if (!map[endDay]) map[endDay] = [];
            map[endDay].push({
              clientName: client.nome,
              clientId: client.id,
              consultas: [],
              color: "bg-destructive/20 text-destructive border-destructive/30",
              eventKey: `${client.id}-saldo-${endDay}`,
              originalDay: endDay,
              tipo: "alerta_saldo",
              label: `Saldo Esgota`,
            });
          }
        }
      });
    }

    // Automação IA - lifecycle events
    if (isAutomacaoView) {
      const automacaoClients = activeClients.filter((c) => !isHefSysClient(c)) as GenericClient[];
      automacaoClients.forEach((client, idx) => {
        if (!client.dataGoLive) return;
        const goLive = new Date(client.dataGoLive + "T00:00:00");
        const color = COLORS[idx % COLORS.length];

        const stages = [
          { label: "Onboarding", offset: -7 },
          { label: "Go-Live", offset: 0 },
          { label: "Fim Testes (7d)", offset: 7 },
          { label: "Revisão 1", offset: 15 },
          { label: "Revisão 2", offset: 60 },
          { label: "Revisão 3", offset: 90 },
          { label: "Revisão 4", offset: 120 },
        ];

        stages.forEach((stage) => {
          const stageDate = new Date(goLive.getTime() + stage.offset * 86400000);
          if (stageDate.getFullYear() === currentYear && stageDate.getMonth() === currentMonth) {
            const day = stageDate.getDate();
            if (!map[day]) map[day] = [];
            map[day].push({
              clientName: client.nome,
              clientId: client.id,
              consultas: [],
              color,
              eventKey: `${client.id}-auto-${stage.offset}`,
              originalDay: day,
              tipo: "automacao",
              label: stage.label,
            });
          }
        });
      });
    }

    return map;
  }, [clients, currentMonth, currentYear, isHefsysView, isTrafegoView, isAutomacaoView]);

  const handleDragStart = useCallback((e: React.DragEvent, eventKey: string) => {
    e.dataTransfer.setData("text/plain", eventKey);
    e.dataTransfer.effectAllowed = "move";
    setDraggingKey(eventKey);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    const eventKey = e.dataTransfer.getData("text/plain");
    if (!eventKey) { setDraggingKey(null); return; }

    for (const [dayStr, events] of Object.entries(eventsByDay)) {
      const ev = events.find((e) => e.eventKey === eventKey);
      if (ev && (ev.tipo === "certidoes" || ev.tipo === "caixas")) {
        const sourceDay = parseInt(dayStr);
        if (sourceDay === targetDay) break;
        const client = clients.find((c) => c.id === ev.clientId);
        if (!client || !isHefSysClient(client)) break;
        const schedule = ev.tipo === "certidoes" ? (client.agendaCertidoes || {}) : (client.agendaCaixasPostais || {});
        saveOverrideMutation.mutate({ clientId: ev.clientId, tipo: ev.tipo, schedule, originalDay: ev.originalDay, newDay: targetDay });
        break;
      }
    }
    setDraggingKey(null);
  }, [eventsByDay, clients, saveOverrideMutation]);

  const handleDragEnd = useCallback(() => {
    setDraggingKey(null);
  }, []);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];

  const isDraggable = (ev: CalendarEvent) => ev.tipo === "certidoes" || ev.tipo === "caixas";

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-[15px] font-semibold min-w-[180px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {clients.filter((c) => c.status === "ativo").length} clientes ativos
              {isHefsysView && " · Arraste eventos entre dias"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
              {day}
            </div>
          ))}

          {Array.from({ length: totalCells }).map((_, i) => {
            const dayNum = i - firstDayOfWeek + 1;
            const isValid = dayNum >= 1 && dayNum <= daysInMonth;
            const isToday = isValid && dayNum === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const weekend = isValid && isWeekend(currentYear, currentMonth, dayNum);
            const events = isValid ? (eventsByDay[dayNum] || []) : [];
            const isSelected = selectedDay === dayNum && isValid;

            return (
              <div
                key={i}
                onDragOver={isValid && isHefsysView ? handleDragOver : undefined}
                onDrop={isValid && isHefsysView ? (e) => handleDrop(e, dayNum) : undefined}
                onClick={() => isValid && events.length > 0 && setSelectedDay(dayNum === selectedDay ? null : dayNum)}
                className={`min-h-[100px] border-b border-r border-border/50 p-1.5 transition-colors ${
                  !isValid ? "bg-secondary/30" : weekend ? "bg-secondary/20" : ""
                } ${isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : ""} ${
                  isValid && events.length > 0 ? "cursor-pointer hover:bg-secondary/40" : ""
                } ${draggingKey && isValid ? "hover:bg-primary/10" : ""}`}
              >
                {isValid && (
                  <>
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-primary-foreground" : weekend ? "text-muted-foreground/50" : "text-foreground"
                    }`}>
                      {dayNum}
                    </div>
                    <div className="space-y-0.5">
                      {events.map((ev, idx) => (
                        <div
                          key={idx}
                          draggable={isDraggable(ev)}
                          onDragStart={isDraggable(ev) ? (e) => { e.stopPropagation(); handleDragStart(e, ev.eventKey); } : undefined}
                          onDragEnd={isDraggable(ev) ? handleDragEnd : undefined}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border truncate flex items-center gap-0.5 ${ev.color} ${isDraggable(ev) ? "cursor-grab active:cursor-grabbing" : ""}`}
                          title={ev.label ? `${ev.label} - ${ev.clientName}` : `${ev.clientName}: ${ev.consultas.map((c) => c.nome).join(", ")}`}
                        >
                          {isDraggable(ev) && <GripVertical size={8} className="opacity-40 flex-shrink-0" />}
                          {ev.tipo === "alerta_saldo" && <AlertTriangle size={8} className="flex-shrink-0" />}
                          {ev.tipo === "conferencia" && <Eye size={8} className="flex-shrink-0" />}
                          {ev.label ? `${ev.clientName}` : `${ev.clientName} (${ev.consultas.length})`}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">
              Dia {selectedDay} de {MONTH_NAMES[currentMonth]} — Detalhamento
            </h3>
            <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {selectedEvents.map((ev, idx) => (
              <div key={idx} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded ${ev.color.split(" ")[0]}`} />
                  <span className="text-sm font-bold">{ev.clientName}</span>
                  {ev.label && <span className="text-[11px] text-muted-foreground">· {ev.label}</span>}
                  {ev.consultas.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">· {ev.consultas.length} consultas</span>
                  )}
                </div>
                {ev.tipo === "alerta_saldo" && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium">
                    <AlertTriangle size={16} />
                    Saldo de anúncios previsto para esgotar neste dia!
                  </div>
                )}
                {ev.tipo === "conferencia" && (
                  <div className="flex items-center gap-2 p-3 bg-clix-warning/10 border border-clix-warning/20 rounded-lg text-sm text-clix-warning font-medium">
                    <Eye size={16} />
                    Conferir conta de anúncios deste cliente
                  </div>
                )}
                {ev.tipo === "automacao" && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary font-medium">
                    <Bot size={16} />
                    {ev.label} — {ev.clientName}
                  </div>
                )}
                {ev.consultas.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {ev.consultas.filter((c) => c.tipo === "certidao").length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5">Certidões</p>
                        <div className="space-y-1">
                          {ev.consultas.filter((c) => c.tipo === "certidao").map((c) => (
                            <div key={c.id} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-clix-info/10 text-clix-info border border-clix-info/20">
                              {c.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {ev.consultas.filter((c) => c.tipo === "caixa_postal").length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5">Caixas Postais</p>
                        <div className="space-y-1">
                          {ev.consultas.filter((c) => c.tipo === "caixa_postal").map((c) => (
                            <div key={c.id} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-clix-magenta/10 text-clix-magenta border border-clix-magenta/20">
                              {c.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {clients.filter((c) => c.status === "ativo").length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Legenda</h3>
          <div className="grid grid-cols-2 gap-3">
            {clients.filter((c) => c.status === "ativo").map((client, idx) => {
              const color = COLORS[idx % COLORS.length];
              if (isHefSysClient(client)) {
                const freq = FREQUENCIAS.find((f) => f.id === client.frequencia);
                return (
                  <div key={client.id} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${color.split(" ")[0]}`} />
                    <span className="text-sm font-medium">{client.nome}</span>
                    <span className="text-[11px] text-muted-foreground">
                      · {freq?.label} · Cert: {scheduleLabel(client.agendaCertidoes || {})} · Caixas: {scheduleLabel(client.agendaCaixasPostais || {})}
                    </span>
                  </div>
                );
              }
              const gc = client as GenericClient;
              return (
                <div key={client.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${color.split(" ")[0]}`} />
                  <span className="text-sm font-medium">{client.nome}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {gc.formaPagamento === "pix" ? " · PIX" : gc.formaPagamento === "cartao" ? " · Cartão" : ""}
                    {gc.rotinaConferencia && Object.keys(gc.rotinaConferencia).length > 0 ? ` · Conf: ${scheduleLabel(gc.rotinaConferencia)}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
