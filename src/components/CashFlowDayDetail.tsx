import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownRight, ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { type MonthSummary, type CashEntry } from "@/hooks/useCashFlow";
import { useCashOverrides } from "@/hooks/useCashOverrides";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/hooks/useCashExpenses";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  month: MonthSummary | null;
  year: number;
  saldoInicialMes: number;
}

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CashFlowDayDetail({ open, onOpenChange, month, year, saldoInicialMes }: Props) {
  const { add: addOverride, remove: removeOverride } = useCashOverrides();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addingOpen, setAddingOpen] = useState(false);
  const [novo, setNovo] = useState({ tipo: "despesa" as "receita" | "despesa", nome: "", categoria: "outros", valor: 0 });

  const daysInMonth = month ? new Date(year, month.month + 1, 0).getDate() : 0;

  const entriesByDay = useMemo(() => {
    const map = new Map<number, CashEntry[]>();
    if (!month) return map;
    for (const e of month.entries) {
      const d = new Date(e.date + "T00:00:00").getDate();
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return map;
  }, [month]);

  const dayTotals = useMemo(() => {
    const map = new Map<number, { rec: number; desp: number }>();
    entriesByDay.forEach((arr, day) => {
      let rec = 0, desp = 0;
      arr.forEach((e) => (e.tipo === "receita" ? (rec += e.valor) : (desp += e.valor)));
      map.set(day, { rec, desp });
    });
    return map;
  }, [entriesByDay]);

  if (!month) return null;

  const selectedEntries = selectedDay ? entriesByDay.get(selectedDay) || [] : [];
  const selectedDate = selectedDay ? `${year}-${String(month.month + 1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : "";

  const submitNew = () => {
    if (!novo.nome.trim() || !selectedDate) return;
    addOverride.mutate({
      tipo: novo.tipo,
      origem_tipo: "avulso",
      nome: novo.nome,
      categoria: novo.categoria,
      data: selectedDate,
      valor: Number(novo.valor) || 0,
    });
    setNovo({ tipo: "despesa", nome: "", categoria: "outros", valor: 0 });
    setAddingOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-card border-l border-border">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {MONTH_NAMES[month.month]} / {year}
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Receitas</div>
            <div className="font-mono text-base font-semibold text-hef-success">R$ {fmt(month.receitas)}</div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Despesas</div>
            <div className="font-mono text-base font-semibold text-hef-danger">R$ {fmt(month.despesas)}</div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Resultado</div>
            <div className={`font-mono text-base font-semibold ${month.resultado >= 0 ? "text-hef-success" : "text-hef-danger"}`}>R$ {fmt(month.resultado)}</div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo final</div>
            <div className={`font-mono text-base font-semibold ${month.saldoFinal >= 0 ? "text-foreground" : "text-hef-danger"}`}>R$ {fmt(month.saldoFinal)}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Calendário</div>
          <div className="grid grid-cols-7 gap-1">
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} className="text-[10px] text-center text-muted-foreground font-semibold">{d}</div>
            ))}
            {Array.from({ length: new Date(year, month.month, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const t = dayTotals.get(day);
              const has = !!t;
              const isReceita = t && t.rec > 0 && t.desp === 0;
              const isDespesa = t && t.desp > 0 && t.rec === 0;
              const isMixed = t && t.rec > 0 && t.desp > 0;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-9 rounded-md text-xs font-mono transition-all border ${
                    isSelected ? "border-primary bg-primary/15 text-primary" :
                    has ? "border-border bg-secondary/60 hover:bg-secondary" : "border-transparent text-muted-foreground/50 hover:bg-secondary/40"
                  }`}
                >
                  <div>{day}</div>
                  {has && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {(isReceita || isMixed) && <span className="w-1 h-1 rounded-full bg-hef-success" />}
                      {(isDespesa || isMixed) && <span className="w-1 h-1 rounded-full bg-hef-danger" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDay !== null && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Dia {selectedDay}</h4>
              <button onClick={() => setAddingOpen((v) => !v)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus size={12} /> Avulso
              </button>
            </div>

            {addingOpen && (
              <div className="p-3 rounded-lg bg-secondary/60 border border-border mb-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                    <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value as any })} className="w-full mt-1 h-8 rounded-md border border-border bg-secondary px-2 text-xs">
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Valor</Label>
                    <Input type="number" step={0.01} value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: Number(e.target.value) })} className="h-8 mt-1 bg-secondary border-border text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Descrição</Label>
                  <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} className="h-8 mt-1 bg-secondary border-border text-xs" />
                </div>
                {novo.tipo === "despesa" && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Categoria</Label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="w-full mt-1 h-8 rounded-md border border-border bg-secondary px-2 text-xs">
                      {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setAddingOpen(false)} className="px-2 py-1 rounded text-[11px] text-muted-foreground">Cancelar</button>
                  <button onClick={submitNew} className="px-3 py-1 rounded text-[11px] font-semibold bg-primary text-primary-foreground">Adicionar</button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              {selectedEntries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Sem lançamentos neste dia.</p>
              )}
              {selectedEntries.map((e) => (
                <div key={e.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${e.tipo === "receita" ? "bg-hef-success/15 text-hef-success" : "bg-hef-danger/15 text-hef-danger"}`}>
                    {e.tipo === "receita" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{e.nome}</div>
                    <div className="text-[10px] text-muted-foreground">{e.tipo === "receita" ? "Receita" : categoryLabel(e.categoria)}</div>
                  </div>
                  <div className={`font-mono text-xs font-semibold ${e.tipo === "receita" ? "text-hef-success" : "text-hef-danger"}`}>
                    {e.tipo === "receita" ? "+" : "−"} R$ {fmt(e.valor)}
                  </div>
                  {e.overrideId && (
                    <button onClick={() => { if (confirm("Remover lançamento avulso?")) removeOverride.mutate(e.overrideId!); }} className="p-1 rounded hover:bg-destructive/10 text-destructive">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}