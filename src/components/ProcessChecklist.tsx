import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useClientChecklist, type ChecklistTipo } from "@/hooks/useClientChecklist";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Loader2 } from "lucide-react";
import { type ScheduleConfig } from "@/data/constants";
import { getScheduleDays } from "@/lib/schedule-utils";

const CERTIDOES_STEPS = [
  { id: "verificar_bases", label: "Verificar as bases que estamos rodando no código / usar o código correto" },
  { id: "rodar_api", label: "Rodar a API / automação" },
  { id: "verificar_emissao", label: "Verificar quanto foi emitido no mês anterior e se tiver menos, verificar o porquê" },
  { id: "relatorio_excel", label: "Fazer o relatório em Excel do que foi emitido e não foi emitido" },
  { id: "subir_arquivos", label: "Subir os arquivos para pasta" },
  { id: "check_arquivos", label: "Verificar se todos os arquivos subiram corretamente ou esquecemos de subir/fazer" },
];

const CAIXAS_POSTAIS_STEPS = [
  { id: "verificar_bases", label: "Verificar as bases que estamos rodando no código / usar o código correto" },
  { id: "rodar_api", label: "Rodar a API / automação" },
  { id: "verificar_mensagens", label: "Verificar se houve mensagens importantes" },
  { id: "enviar_cliente", label: "Se houver, enviar para o WhatsApp do cliente e email" },
];

/** Build a sorted list of all execution dates (YYYY-MM-DD) for the given month range */
function getExecutionDates(schedule: ScheduleConfig, year: number, month: number): string[] {
  const days = getScheduleDays(schedule, year, month);
  return days.map((d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
}

/** Collect execution dates across multiple months for navigation */
function collectDates(schedule: ScheduleConfig, centerYear: number, centerMonth: number, rangeMonths = 6): string[] {
  const dates: string[] = [];
  for (let offset = -rangeMonths; offset <= rangeMonths; offset++) {
    const d = new Date(centerYear, centerMonth + offset, 1);
    dates.push(...getExecutionDates(schedule, d.getFullYear(), d.getMonth()));
  }
  return [...new Set(dates)].sort();
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const weekdays = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const date = new Date(y, m - 1, d);
  return `${weekdays[date.getDay()]}, ${d} ${months[m - 1]} ${y}`;
}

interface Props {
  clientId: string;
  tipo: ChecklistTipo;
  schedule: ScheduleConfig;
}

export default function ProcessChecklist({ clientId, tipo, schedule }: Props) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const allDates = useMemo(
    () => collectDates(schedule, today.getFullYear(), today.getMonth(), 12),
    [schedule, today.getFullYear(), today.getMonth()]
  );

  // Find closest date <= today, or first future date
  const initialDate = useMemo(() => {
    const pastOrToday = allDates.filter((d) => d <= todayStr);
    if (pastOrToday.length > 0) return pastOrToday[pastOrToday.length - 1];
    return allDates[0] || todayStr;
  }, [allDates, todayStr]);

  const [selectedDate, setSelectedDate] = useState(initialDate);

  const currentIndex = allDates.indexOf(selectedDate);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < allDates.length - 1 && allDates[currentIndex + 1] <= todayStr;

  const { checklist, isLoading, toggleStep } = useClientChecklist(clientId, tipo, selectedDate);
  const steps = tipo === "certidoes" ? CERTIDOES_STEPS : CAIXAS_POSTAIS_STEPS;
  const stepsState = checklist?.steps || {};
  const doneCount = steps.filter((s) => stepsState[s.id]).length;
  const allDone = doneCount === steps.length;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
        <Loader2 size={14} className="animate-spin" /> Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {tipo === "certidoes" ? "Checklist Certidões" : "Checklist Caixas Postais"}
        </span>
        <span className={`text-[11px] font-semibold flex items-center gap-1 ${allDone ? "text-clix-success" : "text-muted-foreground"}`}>
          {allDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}
          {doneCount}/{steps.length}
        </span>
      </div>

      {/* Day navigation */}
      <div className="flex items-center justify-center gap-1 mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!canPrev}
          onClick={() => setSelectedDate(allDates[currentIndex - 1])}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-xs font-medium min-w-[150px] text-center">
          {formatDate(selectedDate)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={!canNext}
          onClick={() => setSelectedDate(allDates[currentIndex + 1])}
        >
          <ChevronRight size={14} />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-clix-success transition-all duration-300 rounded-full"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-0.5">
        {steps.map((step, i) => {
          const done = !!stepsState[step.id];
          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                done ? "bg-clix-success/5" : "hover:bg-muted/50"
              }`}
              onClick={() => toggleStep(step.id)}
            >
              <Checkbox checked={done} className="mt-0.5 shrink-0" tabIndex={-1} />
              <span className={`text-sm leading-snug ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                <span className="text-muted-foreground font-mono text-[11px] mr-1.5">{i + 1}.</span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
