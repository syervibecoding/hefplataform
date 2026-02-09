import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ScheduleConfig, DIAS_SEMANA_LABELS } from "@/data/constants";

interface Props {
  label: string;
  value: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  colorClass?: string;
}

export default function ScheduleInput({ label, value, onChange, colorClass = "text-primary" }: Props) {
  const [diasText, setDiasText] = useState((value.dias || []).join(", "));

  useEffect(() => {
    setDiasText((value.dias || []).join(", "));
  }, [value.dias]);

  const handleDiasChange = (text: string) => {
    setDiasText(text);
    const dias = text
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 31);
    onChange({ ...value, dias });
  };

  const handleDiaSemanaChange = (val: string) => {
    const next = { ...value };
    if (val === "") {
      delete next.diaSemana;
    } else {
      next.diaSemana = parseInt(val);
    }
    onChange(next);
  };

  const handlePrimeiroDiaUtil = (checked: boolean) => {
    const next = { ...value };
    if (checked) {
      next.primeiroDiaUtil = true;
    } else {
      delete next.primeiroDiaUtil;
    }
    onChange(next);
  };

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border bg-secondary/30">
      <Label className={`text-xs font-semibold ${colorClass}`}>{label}</Label>

      <div>
        <Label className="text-[11px] text-muted-foreground">Dias específicos do mês</Label>
        <Input
          value={diasText}
          onChange={(e) => handleDiasChange(e.target.value)}
          placeholder="1, 15, 22"
          className="mt-1 bg-secondary border-border h-8 text-xs"
        />
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground">Repetir toda semana</Label>
        <select
          value={value.diaSemana !== undefined ? value.diaSemana : ""}
          onChange={(e) => handleDiaSemanaChange(e.target.value)}
          className="w-full mt-1 h-8 rounded-md border border-border bg-secondary px-2 text-xs"
        >
          <option value="">Nenhum</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>{DIAS_SEMANA_LABELS[d]}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value.primeiroDiaUtil}
          onChange={(e) => handlePrimeiroDiaUtil(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-[11px] text-muted-foreground">Primeiro dia útil do mês</span>
      </label>
    </div>
  );
}
