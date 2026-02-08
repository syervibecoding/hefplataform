import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

// Adjust execution day: if falls on weekend, move to next Monday
function adjustForWeekend(year: number, month: number, day: number): number {
  const totalDays = getDaysInMonth(year, month);
  let d = Math.min(day, totalDays);
  const date = new Date(year, month, d);
  const dow = date.getDay();
  if (dow === 6) d += 2; // Saturday -> Monday
  if (dow === 0) d += 1; // Sunday -> Monday
  if (d > totalDays) d = totalDays; // clamp
  return d;
}

interface CalendarEvent {
  clientName: string;
  consultas: string[];
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

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    const activeClients = clients.filter((c) => c.status === "ativo");

    activeClients.forEach((client, idx) => {
      const color = COLORS[idx % COLORS.length];
      const freq = FREQUENCIAS.find((f) => f.id === client.frequencia);

      client.diasExecucao.forEach((day) => {
        const adjustedDay = adjustForWeekend(currentYear, currentMonth, day);
        if (!map[adjustedDay]) map[adjustedDay] = [];
        map[adjustedDay].push({
          clientName: client.nome,
          consultas: client.consultas,
          color,
        });
      });
    });

    return map;
  }, [clients, currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  return (
    <div className="space-y-4">
      {/* Header */}
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
            {clients.filter((c) => c.status === "ativo").length} clientes ativos · Fins de semana ajustados automaticamente
          </span>
        </div>

        {/* Calendar Grid */}
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

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r border-border/50 p-1.5 ${
                  !isValid ? "bg-secondary/30" : weekend ? "bg-secondary/20" : ""
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
                          title={`${ev.clientName}: ${ev.consultas.length} consultas`}
                        >
                          {ev.clientName}
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
