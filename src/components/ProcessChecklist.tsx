import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useClientChecklist, useReconcileChecklists, isStepDone, getStepInfo, getCustomSteps, type ChecklistTipo } from "@/hooks/useClientChecklist";
import { useChecklistSteps } from "@/hooks/useChecklistSteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { type ScheduleConfig } from "@/data/constants";
import { getScheduleDays } from "@/lib/schedule-utils";
import { useAuth } from "@/contexts/AuthContext";

function getExecutionDates(schedule: ScheduleConfig, year: number, month: number): string[] {
  const days = getScheduleDays(schedule, year, month);
  return days.map((d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
}

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

function formatCheckTime(isoStr: string): string {
  const d = new Date(isoStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Props {
  clientId: string;
  tipo: ChecklistTipo;
  schedule: ScheduleConfig;
}

export default function ProcessChecklist({ clientId, tipo, schedule }: Props) {
  const { user, profile, isAdmin } = useAuth();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const allDates = useMemo(
    () => collectDates(schedule, today.getFullYear(), today.getMonth(), 12),
    [schedule, today.getFullYear(), today.getMonth()]
  );

  useReconcileChecklists(clientId, tipo, allDates);

  const initialDate = useMemo(() => {
    const pastOrToday = allDates.filter((d) => d <= todayStr);
    if (pastOrToday.length > 0) return pastOrToday[pastOrToday.length - 1];
    return allDates[0] || todayStr;
  }, [allDates, todayStr]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const currentIndex = allDates.indexOf(selectedDate);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < allDates.length - 1 && allDates[currentIndex + 1] <= todayStr;

  const { checklist, isLoading, toggleStep, addCustomStep, removeCustomStep, editCustomStep, isAddingCustom } = useClientChecklist(clientId, tipo, selectedDate);
  const { steps: templateSteps, isLoading: stepsLoading } = useChecklistSteps(tipo);

  const stepsState = (checklist?.steps || {}) as Record<string, any>;
  const customSteps = getCustomSteps(stepsState);

  // Merge template steps + custom steps for this day
  const allSteps = useMemo(() => {
    const merged: { id: string; label: string; isCustom: boolean }[] = [];
    templateSteps.forEach((s) => merged.push({ id: s.id, label: s.label, isCustom: false }));
    customSteps.forEach((s) => merged.push({ id: s.id, label: s.label, isCustom: true }));
    return merged;
  }, [templateSteps, customSteps]);

  const doneCount = allSteps.filter((s) => isStepDone(stepsState[s.id])).length;
  const allDone = allSteps.length > 0 && doneCount === allSteps.length;

  const handleAddStep = () => {
    const trimmed = newStepLabel.trim();
    if (!trimmed) return;
    addCustomStep(trimmed);
    setNewStepLabel("");
    setShowAddStep(false);
  };

  const handleStartEdit = (stepId: string, label: string) => {
    setEditingStepId(stepId);
    setEditingLabel(label);
  };

  const handleSaveEdit = () => {
    if (editingStepId && editingLabel.trim()) {
      editCustomStep(editingStepId, editingLabel.trim());
    }
    setEditingStepId(null);
    setEditingLabel("");
  };

  if (isLoading || stepsLoading) {
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
          {doneCount}/{allSteps.length}
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
          style={{ width: allSteps.length > 0 ? `${(doneCount / allSteps.length) * 100}%` : "0%" }}
        />
      </div>

      <ol className="space-y-0.5">
        {allSteps.map((step, i) => {
          const val = stepsState[step.id];
          const done = isStepDone(val);
          const info = getStepInfo(val);
          const isEditing = editingStepId === step.id;

          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                done ? "bg-clix-success/5" : "hover:bg-muted/50"
              }`}
              onClick={() => !isEditing && user && toggleStep(step.id, user.id, profile?.username || "desconhecido")}
            >
              <Checkbox checked={done} className="mt-0.5 shrink-0" tabIndex={-1} />
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") { setEditingStepId(null); setEditingLabel(""); }
                      }}
                    />
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSaveEdit}>OK</Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingStepId(null); setEditingLabel(""); }}>
                      <X size={12} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className={`text-sm leading-snug ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      <span className="text-muted-foreground font-mono text-[11px] mr-1.5">{i + 1}.</span>
                      {step.label}
                      {step.isCustom && (
                        <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-clix-warning/10 text-clix-warning font-semibold">
                          local
                        </span>
                      )}
                    </span>
                    {isAdmin && done && info?.username && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {info.username}{info.at ? ` · ${formatCheckTime(info.at)}` : ""}
                      </div>
                    )}
                  </>
                )}
              </div>
              {isAdmin && step.isCustom && !isEditing && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(step.id, step.label);
                    }}
                    title="Editar processo"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomStep(step.id);
                    }}
                    title="Remover processo"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Add custom step for this day */}
      {isAdmin && (
        <div className="pt-2">
          {showAddStep ? (
            <div className="flex items-center gap-2">
              <Input
                value={newStepLabel}
                onChange={(e) => setNewStepLabel(e.target.value)}
                placeholder="Processo apenas para este dia..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddStep();
                  if (e.key === "Escape") { setShowAddStep(false); setNewStepLabel(""); }
                }}
              />
              <Button size="sm" className="h-8 px-3" onClick={handleAddStep} disabled={isAddingCustom || !newStepLabel.trim()}>
                {isAddingCustom ? <Loader2 size={14} className="animate-spin" /> : "Adicionar"}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setShowAddStep(false); setNewStepLabel(""); }}>
                <X size={14} />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground w-full justify-start gap-1"
              onClick={() => setShowAddStep(true)}
            >
              <Plus size={12} /> Adicionar processo (só este dia)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
