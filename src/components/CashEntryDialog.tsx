import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCashOverrides, type OverrideTipo } from "@/hooks/useCashOverrides";
import { ENTRY_TYPE_META, type CashEntry } from "@/hooks/useCashFlow";
import { EXPENSE_CATEGORIES } from "@/hooks/useCashExpenses";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: string;
  // If editing an existing override or adjusting a projected client entry:
  editing?: CashEntry | null;
  // If forced via context (e.g. clicking "Ajustar este mês" in projected client row):
  lockedOrigin?: { origem_tipo: "cliente" | "despesa"; origem_id: string; tipo: OverrideTipo; nome: string; categoria?: string } | null;
}

const TYPES: { id: OverrideTipo; label: string; hint: string }[] = [
  { id: "receita", label: "Receita", hint: "Entrada operacional" },
  { id: "despesa", label: "Despesa", hint: "Saída operacional" },
  { id: "investimento", label: "Investimento", hint: "Aplicação financeira ou CAPEX (bens de longo prazo)" },
  { id: "aporte", label: "Aporte de sócio", hint: "Entrada de capital" },
  { id: "retirada", label: "Retirada de sócio", hint: "Pró-labore / distribuição" },
];

export default function CashEntryDialog({ open, onOpenChange, defaultDate, editing, lockedOrigin }: Props) {
  const { add, update } = useCashOverrides();
  const [tipo, setTipo] = useState<OverrideTipo>("despesa");
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [data, setData] = useState(defaultDate);
  const [categoria, setCategoria] = useState("outros");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTipo(editing.tipo);
      setNome(editing.nome);
      setValor(editing.valor);
      setData(editing.date);
      setCategoria(editing.categoria || "outros");
    } else if (lockedOrigin) {
      setTipo(lockedOrigin.tipo);
      setNome(lockedOrigin.nome);
      setValor(0);
      setData(defaultDate);
      setCategoria(lockedOrigin.categoria || "outros");
    } else {
      setTipo("despesa");
      setNome("");
      setValor(0);
      setData(defaultDate);
      setCategoria("outros");
    }
  }, [open, editing, lockedOrigin, defaultDate]);

  const isEditingOverride = !!(editing?.overrideId);
  const canChangeType = !lockedOrigin && !editing?.origemId;
  const showCategoria = tipo === "despesa" || tipo === "investimento";

  const submit = async () => {
    if (!nome.trim() || !data) return;
    const payload = {
      tipo,
      nome: nome.trim(),
      valor: Number(valor) || 0,
      data,
      categoria: showCategoria ? categoria : null,
      origem_tipo: lockedOrigin?.origem_tipo || (editing?.origemId ? (editing.origemTipo as any) : "avulso"),
      origem_id: lockedOrigin?.origem_id || editing?.origemId || null,
    };
    if (isEditingOverride) {
      await update.mutateAsync({ id: editing!.overrideId!, data: payload });
    } else {
      await add.mutateAsync(payload as any);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditingOverride ? "Editar lançamento" : lockedOrigin ? `Ajustar mês: ${lockedOrigin.nome}` : "Novo lançamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">Tipo</Label>
            <div className="grid grid-cols-5 gap-1 mt-1">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={!canChangeType}
                  onClick={() => setTipo(t.id)}
                  title={t.hint}
                  className={`px-2 py-1.5 rounded-md text-[10px] font-semibold border transition-all ${
                    tipo === t.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
                  } ${!canChangeType ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{TYPES.find((t) => t.id === tipo)?.hint}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-9 mt-1 bg-secondary border-border text-xs" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Valor (R$)</Label>
              <Input type="number" step={0.01} value={valor} onChange={(e) => setValor(Number(e.target.value))} className="h-9 mt-1 bg-secondary border-border text-xs font-mono" />
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Descrição</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Notebook novo, projeto X..." className="h-9 mt-1 bg-secondary border-border text-xs" />
          </div>

          {showCategoria && (
            <div>
              <Label className="text-[11px] text-muted-foreground">Categoria</Label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full mt-1 h-9 rounded-md border border-border bg-secondary px-2 text-xs">
                {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          )}

          {lockedOrigin && (
            <p className="text-[10px] text-muted-foreground bg-secondary/60 border border-border rounded-md p-2">
              Esse lançamento substitui o valor projetado deste cliente apenas neste mês. Use <strong>0</strong> para indicar que não houve recebimento.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={add.isPending || update.isPending}>
            {isEditingOverride ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}