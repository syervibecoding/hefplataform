import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type HefSysClient, TODAS_CONSULTAS, FREQUENCIAS } from "@/data/constants";

interface Props {
  clients: HefSysClient[];
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

function adjustForWeekend(year: number, month: number, day: number): number {
  const totalDays = getDaysInMonth(year, month);
  let d = Math.min(day, totalDays);
  const date = new Date(year, month, d);
  const dow = date.getDay();
  if (dow === 6) d += 2;
  if (dow === 0) d += 1;
  if (d > totalDays) d = totalDays;
  return d;
}

interface CalendarEvent {
  clientName: string;
  clientId: string;
  consultas: { id: string; nome: string; tipo: string }[];
  color: string;
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

export default function CalendarPage({ clients }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    const activeClients = clients.filter((c) => c.status === "ativo");

    activeClients.forEach((client, idx) => {
      const color = COLORS[idx % COLORS.length];
      const consultaDetails = client.consultas
        .map((cid) => TODAS_CONSULTAS.find((q) => q.id === cid))
        .filter(Boolean)
        .map((q) => ({ id: q!.id, nome: q!.nome, tipo: q!.tipo }));

      client.diasExecucao.forEach((day) => {
        const adjustedDay = adjustForWeekend(currentYear, currentMonth, day);
        if (!map[adjustedDay]) map[adjustedDay] = [];
        map[adjustedDay].push({
          clientName: client.nome,
          clientId: client.id,
          consultas: consultaDetails,
          color,
        });
      });
    });

    return map;
  }, [clients, currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const selectedEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];

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
          <span className="text-xs text-muted-foreground">
            {clients.filter((c) => c.status === "ativo").length} clientes ativos · Clique no dia para ver detalhes
          </span>
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
                onClick={() => isValid && events.length > 0 && setSelectedDay(dayNum === selectedDay ? null : dayNum)}
                className={`min-h-[100px] border-b border-r border-border/50 p-1.5 transition-colors ${
                  !isValid ? "bg-secondary/30" : weekend ? "bg-secondary/20" : ""
                } ${isSelected ? "ring-2 ring-primary ring-inset bg-primary/5" : ""} ${
                  isValid && events.length > 0 ? "cursor-pointer hover:bg-secondary/40" : ""
                }`}
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
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border truncate ${ev.color}`}
                          title={`${ev.clientName}: ${ev.consultas.map((c) => c.nome).join(", ")}`}
                        >
                          {ev.clientName} ({ev.consultas.length})
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
              Dia {selectedDay} de {MONTH_NAMES[currentMonth]} — Detalhamento das Consultas
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
                  <span className="text-[11px] text-muted-foreground">
                    · {ev.consultas.length} consultas
                  </span>
                </div>
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
              const freq = FREQUENCIAS.find((f) => f.id === client.frequencia);
              return (
                <div key={client.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${color.split(" ")[0]}`} />
                  <span className="text-sm font-medium">{client.nome}</span>
                  <span className="text-[11px] text-muted-foreground">
                    · {freq?.label} · Dias: {client.diasExecucao.join(", ")} · {client.consultas.length} consultas
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
