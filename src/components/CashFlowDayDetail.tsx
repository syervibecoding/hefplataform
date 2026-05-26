import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ArrowDownRight, ArrowUpRight, Plus, MoreVertical, Pencil, Trash2, Wrench, Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { type MonthSummary, type CashEntry, ENTRY_TYPE_META } from "@/hooks/useCashFlow";
import { useCashOverrides } from "@/hooks/useCashOverrides";
import { categoryLabel } from "@/hooks/useCashExpenses";
import CashEntryDialog from "@/components/CashEntryDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

function entryIcon(tipo: CashEntry["tipo"]) {
  if (tipo === "receita") return <ArrowDownRight size={14} />;
  if (tipo === "despesa") return <ArrowUpRight size={14} />;
  if (tipo === "investimento") return <Wrench size={14} />;
  if (tipo === "aporte") return <TrendingUp size={14} />;
  return <TrendingDown size={14} />;
}

function entryColor(tipo: CashEntry["tipo"]) {
  const sign = ENTRY_TYPE_META[tipo].sign;
  if (tipo === "investimento") return "bg-amber-500/15 text-amber-500";
  if (tipo === "aporte" || tipo === "retirada") return sign > 0 ? "bg-sky-500/15 text-sky-500" : "bg-fuchsia-500/15 text-fuchsia-500";
  return sign > 0 ? "bg-hef-success/15 text-hef-success" : "bg-hef-danger/15 text-hef-danger";
}

function amountColor(tipo: CashEntry["tipo"]) {
  const sign = ENTRY_TYPE_META[tipo].sign;
  if (tipo === "investimento") return "text-amber-500";
  if (tipo === "aporte" || tipo === "retirada") return sign > 0 ? "text-sky-500" : "text-fuchsia-500";
  return sign > 0 ? "text-hef-success" : "text-hef-danger";
}

export default function CashFlowDayDetail({ open, onOpenChange, month, year, saldoInicialMes }: Props) {
  const { remove: removeOverride } = useCashOverrides();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; date: string; editing?: CashEntry | null; locked?: any }>({ open: false, date: "" });

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
    const map = new Map<number, { inflow: number; outflow: number }>();
    entriesByDay.forEach((arr, day) => {
      let inflow = 0, outflow = 0;
      arr.forEach((e) => {
        const s = ENTRY_TYPE_META[e.tipo].sign;
        if (s > 0) inflow += e.valor; else outflow += e.valor;
      });
      map.set(day, { inflow, outflow });
    });
    return map;
  }, [entriesByDay]);

  if (!month) return null;

  const selectedEntries = selectedDay ? entriesByDay.get(selectedDay) || [] : [];
  const selectedDate = selectedDay ? `${year}-${String(month.month + 1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}` : "";
  const firstOfMonth = `${year}-${String(month.month + 1).padStart(2,"0")}-01`;

  const openNew = (date: string) => setDialogState({ open: true, date, editing: null, locked: null });
  const openEdit = (e: CashEntry) => setDialogState({ open: true, date: e.date, editing: e, locked: null });
  const openAdjust = (e: CashEntry) =>
    setDialogState({
      open: true,
      date: e.date,
      editing: null,
      locked: { origem_tipo: e.origemTipo, origem_id: e.origemId, tipo: e.tipo, nome: e.nome, categoria: e.categoria },
    });

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-card border-l border-border">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="font-heading">
              {MONTH_NAMES[month.month]} / {year}
            </SheetTitle>
            <button
              onClick={() => openNew(selectedDate || firstOfMonth)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={12} /> Lançamento
            </button>
          </div>
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
          {(month.investimentos > 0 || month.aportes > 0 || month.retiradas > 0) && (
            <>
              {month.investimentos > 0 && (
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Investimentos</div>
                  <div className="font-mono text-base font-semibold text-amber-500">R$ {fmt(month.investimentos)}</div>
                </div>
              )}
              {(month.aportes > 0 || month.retiradas > 0) && (
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sócios</div>
                  <div className="font-mono text-base font-semibold text-sky-500">
                    +{fmt(month.aportes)} / −{fmt(month.retiradas)}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Resultado de caixa</div>
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
              const isIn = t && t.inflow > 0 && t.outflow === 0;
              const isOut = t && t.outflow > 0 && t.inflow === 0;
              const isMixed = t && t.inflow > 0 && t.outflow > 0;
              const isSelected = selectedDay === day;
              const dateStr = `${year}-${String(month.month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              return (
                <div key={day} className="relative group">
                  <button
                    onClick={() => setSelectedDay(day)}
                    className={`w-full h-9 rounded-md text-xs font-mono transition-all border ${
                      isSelected ? "border-primary bg-primary/15 text-primary" :
                      has ? "border-border bg-secondary/60 hover:bg-secondary" : "border-transparent text-muted-foreground/50 hover:bg-secondary/40"
                    }`}
                  >
                    <div>{day}</div>
                    {has && (
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {(isIn || isMixed) && <span className="w-1 h-1 rounded-full bg-hef-success" />}
                        {(isOut || isMixed) && <span className="w-1 h-1 rounded-full bg-hef-danger" />}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(ev) => { ev.stopPropagation(); openNew(dateStr); }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Adicionar lançamento neste dia"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay !== null && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Dia {selectedDay}</h4>
              <button onClick={() => openNew(selectedDate)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                <Plus size={12} /> Adicionar
              </button>
            </div>

            <div className="space-y-1.5">
              {selectedEntries.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Sem lançamentos neste dia.</p>
              )}
              {selectedEntries.map((e) => {
                const sign = ENTRY_TYPE_META[e.tipo].sign;
                const isProjected = !e.overrideId && (e.origemTipo === "cliente" || e.origemTipo === "despesa");
                const meta = ENTRY_TYPE_META[e.tipo];
                return (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/40 border border-border">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${entryColor(e.tipo)}`}>
                      {entryIcon(e.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{e.nome}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {meta.label}
                        {(e.tipo === "despesa" || e.tipo === "investimento") && e.categoria ? ` · ${categoryLabel(e.categoria)}` : ""}
                        {e.overrideId ? " · avulso" : isProjected ? " · projetado" : ""}
                      </div>
                    </div>
                    <div className={`font-mono text-xs font-semibold ${amountColor(e.tipo)}`}>
                      {sign > 0 ? "+" : "−"} R$ {fmt(e.valor)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-secondary text-muted-foreground"><MoreVertical size={12} /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        {e.overrideId && (
                          <>
                            <DropdownMenuItem onClick={() => openEdit(e)}><Pencil size={12} className="mr-2" />Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (confirm("Remover este lançamento?")) removeOverride.mutate(e.overrideId!); }}>
                              <Trash2 size={12} className="mr-2" />Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                        {isProjected && (
                          <DropdownMenuItem onClick={() => openAdjust(e)}>
                            <Wallet size={12} className="mr-2" />Ajustar este mês
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    <CashEntryDialog
      open={dialogState.open}
      onOpenChange={(v) => setDialogState((s) => ({ ...s, open: v }))}
      defaultDate={dialogState.date}
      editing={dialogState.editing}
      lockedOrigin={dialogState.locked}
    />
    </>
  );
}