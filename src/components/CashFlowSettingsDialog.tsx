import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCashSettings } from "@/hooks/useCashSettings";
import { useCashExpenses, categoryLabel, type CashExpense } from "@/hooks/useCashExpenses";
import CashExpenseDialog from "./CashExpenseDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function CashFlowSettingsDialog({ open, onOpenChange }: Props) {
  const { settings, save } = useCashSettings(open);
  const { expenses, add, update, remove } = useCashExpenses(open);

  const [saldo, setSaldo] = useState(0);
  const [dataSaldo, setDataSaldo] = useState(new Date().toISOString().slice(0, 10));
  const [expOpen, setExpOpen] = useState(false);
  const [editing, setEditing] = useState<CashExpense | null>(null);

  useEffect(() => {
    if (settings) {
      setSaldo(settings.saldo_inicial);
      setDataSaldo(settings.data_saldo_inicial);
    }
  }, [settings]);

  const saveSettings = () => {
    save.mutate({ saldo_inicial: Number(saldo) || 0, data_saldo_inicial: dataSaldo });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">Configurações do Fluxo de Caixa</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-2">
            <section className="p-4 rounded-lg bg-secondary/40 border border-border">
              <h3 className="text-sm font-semibold mb-3">Saldo Inicial</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                  <Input type="number" step={0.01} value={saldo} onChange={(e) => setSaldo(Number(e.target.value))} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">A partir de</Label>
                  <Input type="date" value={dataSaldo} onChange={(e) => setDataSaldo(e.target.value)} className="mt-1 bg-secondary border-border" />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={saveSettings} disabled={save.isPending} className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                  Salvar saldo
                </button>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Despesas</h3>
                <button onClick={() => { setEditing(null); setExpOpen(true); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
                  <Plus size={12} /> Nova despesa
                </button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/60 text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Nome</th>
                      <th className="text-left px-3 py-2 font-semibold">Categoria</th>
                      <th className="text-right px-3 py-2 font-semibold">Valor</th>
                      <th className="text-center px-3 py-2 font-semibold">Dia</th>
                      <th className="text-center px-3 py-2 font-semibold">Período</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="font-medium">{e.nome}</div>
                          {!e.ativo && <span className="text-[10px] text-muted-foreground">inativa</span>}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{categoryLabel(e.categoria)}</td>
                        <td className="px-3 py-2 text-right font-mono">R$ {e.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 text-center">{e.ultimo_dia_util ? "Últ. útil" : `Dia ${e.dia_pagamento}`}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          {e.data_inicio.slice(0, 7)}{e.data_fim ? ` → ${e.data_fim.slice(0, 7)}` : ""}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditing(e); setExpOpen(true); }} className="p-1 rounded hover:bg-secondary"><Pencil size={12} /></button>
                            <button onClick={() => { if (confirm(`Excluir despesa "${e.nome}"?`)) remove.mutate(e.id); }} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Nenhuma despesa cadastrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <CashExpenseDialog
        open={expOpen}
        onOpenChange={setExpOpen}
        initial={editing}
        onSubmit={(v) => {
          if (editing) update.mutate({ id: editing.id, data: v });
          else add.mutate(v);
        }}
      />
    </>
  );
}