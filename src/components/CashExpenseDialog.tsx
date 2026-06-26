import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXPENSE_CATEGORIES, type CashExpense } from "@/hooks/useCashExpenses";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: CashExpense | null;
  onSubmit: (v: Omit<CashExpense, "id">) => void;
}

const empty: Omit<CashExpense, "id"> = {
  nome: "",
  categoria: "outros",
  valor: 0,
  dia_pagamento: 5,
  ultimo_dia_util: false,
  recorrencia: "mensal",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_fim: null,
  ativo: true,
  aliases: [],
};

export default function CashExpenseDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [form, setForm] = useState<Omit<CashExpense, "id">>(empty);

  useEffect(() => {
    if (open) {
      if (initial) {
        const { id: _id, ...rest } = initial;
        setForm(rest);
      } else setForm(empty);
    }
  }, [open, initial]);

  const submit = () => {
    if (!form.nome.trim()) return;
    onSubmit({
      ...form,
      valor: Number(form.valor) || 0,
      dia_pagamento: Math.max(1, Math.min(31, Number(form.dia_pagamento) || 5)),
      data_fim: form.data_fim || null,
      aliases: (form.aliases || []).map((a) => a.trim()).filter(Boolean),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold font-heading">
            {initial ? "Editar Despesa" : "Nova Despesa"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1 bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
              <Input type="number" min={0} step={0.01} value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Recorrência</Label>
              <select value={form.recorrencia} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                <option value="mensal">Mensal</option>
                <option value="unica">Única</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Dia do mês</Label>
              <Input type="number" min={1} max={31} value={form.dia_pagamento} disabled={form.ultimo_dia_util} onChange={(e) => setForm({ ...form, dia_pagamento: Number(e.target.value) })} className="mt-1 bg-secondary border-border disabled:opacity-50" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ultimo_dia_util} onChange={(e) => setForm({ ...form, ultimo_dia_util: e.target.checked })} className="h-4 w-4 rounded border-border bg-secondary accent-primary" />
            <span className="text-xs text-muted-foreground">Pago no último dia útil do mês</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Início</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fim (opcional)</Label>
              <Input type="date" value={form.data_fim || ""} onChange={(e) => setForm({ ...form, data_fim: e.target.value || null })} className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="h-4 w-4 rounded border-border bg-secondary accent-primary" />
            <span className="text-xs text-muted-foreground">Ativa</span>
          </label>
          <div>
            <Label className="text-xs text-muted-foreground">Apelidos na fatura (separe por vírgula)</Label>
            <Input
              value={(form.aliases || []).join(", ")}
              onChange={(e) => setForm({ ...form, aliases: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="LOVABLE DO, OPENAI *CHATGPT, DM*HOSTINGER"
              className="mt-1 bg-secondary border-border"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Como esse fornecedor aparece na fatura do cartão. Usado para detectar duplicatas na importação.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
            <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}