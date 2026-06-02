import { useState } from "react";
import { Pencil } from "lucide-react";
import { Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useInvestments,
  INVESTMENT_TYPES,
  LIQUIDEZ_OPTIONS,
  type Investment,
} from "@/hooks/useInvestments";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function brl(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvestmentsManagerDialog({ open, onOpenChange }: Props) {
  const {
    investments,
    transactions,
    balances,
    addInvestment,
    updateInvestment,
    removeInvestment,
    addTransaction,
    removeTransaction,
  } = useInvestments(open);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Omit<Investment, "id">>({
    nome: "",
    instituicao: "",
    tipo: "cdb",
    liquidez: "diaria",
    rendimento_anual: 0,
    saldo_inicial: 0,
    data_inicial: new Date().toISOString().slice(0, 10),
    ativo: true,
    notas: "",
  });

  const [txForms, setTxForms] = useState<Record<string, { data: string; tipo: "aporte" | "resgate" | "rendimento"; valor: number }>>({});
  const [editingRate, setEditingRate] = useState<Record<string, number>>({});

  const resetForm = () =>
    setForm({
      nome: "",
      instituicao: "",
      tipo: "cdb",
      liquidez: "diaria",
      rendimento_anual: 0,
      saldo_inicial: 0,
      data_inicial: new Date().toISOString().slice(0, 10),
      ativo: true,
      notas: "",
    });

  const handleAdd = async () => {
    if (!form.nome.trim()) return;
    await addInvestment.mutateAsync(form);
    resetForm();
    setAdding(false);
  };

  const handleAddTx = async (invId: string) => {
    const f = txForms[invId];
    if (!f || !f.valor) return;
    await addTransaction.mutateAsync({
      investment_id: invId,
      data: f.data,
      tipo: f.tipo,
      valor: f.valor,
      notas: null,
    });
    setTxForms((s) => ({ ...s, [invId]: { ...f, valor: 0 } }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investimentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!adding ? (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5">
              <Plus size={14} /> Nova aplicação
            </Button>
          ) : (
            <div className="bg-secondary/40 border border-border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nome</label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="CDB Liquidez Diária" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Instituição</label>
                  <Input value={form.instituicao || ""} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} placeholder="Banco/Corretora" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Liquidez</label>
                  <Select value={form.liquidez} onValueChange={(v) => setForm({ ...form, liquidez: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIQUIDEZ_OPTIONS.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Saldo inicial (R$)</label>
                  <Input type="number" step="0.01" value={form.saldo_inicial} onChange={(e) => setForm({ ...form, saldo_inicial: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Data inicial</label>
                  <Input type="date" value={form.data_inicial} onChange={(e) => setForm({ ...form, data_inicial: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Rendimento anual estimado (%)</label>
                  <Input type="number" step="0.01" value={form.rendimento_anual} onChange={(e) => setForm({ ...form, rendimento_anual: Number(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { resetForm(); setAdding(false); }}>Cancelar</Button>
                <Button size="sm" onClick={handleAdd}>Salvar</Button>
              </div>
            </div>
          )}

          {investments.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhuma aplicação cadastrada
            </div>
          )}

          {investments.map((inv) => {
            const saldo = balances.get(inv.id) || 0;
            const txs = transactions.filter((t) => t.investment_id === inv.id);
            const tipoLabel = INVESTMENT_TYPES.find((t) => t.id === inv.tipo)?.label || inv.tipo;
            const liqLabel = LIQUIDEZ_OPTIONS.find((t) => t.id === inv.liquidez)?.label || inv.liquidez;
            const txForm = txForms[inv.id] || { data: new Date().toISOString().slice(0, 10), tipo: "aporte" as const, valor: 0 };
            return (
              <div key={inv.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{inv.nome}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                      <span>{tipoLabel} · {liqLabel}</span>
                      {inv.instituicao ? <span>· {inv.instituicao}</span> : null}
                      {editingRate[inv.id] !== undefined ? (
                        <span className="flex items-center gap-1">
                          <span>·</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="h-6 w-20 text-xs px-1 py-0"
                            value={editingRate[inv.id]}
                            onChange={(e) => setEditingRate((s) => ({ ...s, [inv.id]: Number(e.target.value) || 0 }))}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                await updateInvestment.mutateAsync({ id: inv.id, data: { rendimento_anual: editingRate[inv.id] } });
                                setEditingRate((s) => { const ns = { ...s }; delete ns[inv.id]; return ns; });
                              }
                            }}
                            autoFocus
                          />
                          <span>% a.a.</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1 py-0 text-[10px]"
                            onClick={async () => {
                              await updateInvestment.mutateAsync({ id: inv.id, data: { rendimento_anual: editingRate[inv.id] } });
                              setEditingRate((s) => { const ns = { ...s }; delete ns[inv.id]; return ns; });
                            }}
                          >
                            Salvar
                          </Button>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          {inv.rendimento_anual ? <span>· {inv.rendimento_anual}% a.a.</span> : <span>· --% a.a.</span>}
                          <button
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => setEditingRate((s) => ({ ...s, [inv.id]: inv.rendimento_anual }))}
                            title="Editar rendimento"
                          >
                            <Pencil size={10} />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-xs text-muted-foreground">Saldo atual</div>
                    <div className="text-lg font-bold font-mono text-hef-success">{brl(saldo)}</div>
                  </div>
                  <button
                    onClick={() => { if (confirm("Excluir esta aplicação e seu histórico?")) removeInvestment.mutate(inv.id); }}
                    className="ml-2 p-1.5 text-muted-foreground hover:text-destructive"
                    title="Excluir aplicação"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="bg-secondary/40 rounded-md p-3 space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Lançamento</div>
                  <div className="flex flex-wrap gap-2 items-end">
                    <Input type="date" value={txForm.data} onChange={(e) => setTxForms((s) => ({ ...s, [inv.id]: { ...txForm, data: e.target.value } }))} className="h-9 w-[140px]" />
                    <Select value={txForm.tipo} onValueChange={(v: any) => setTxForms((s) => ({ ...s, [inv.id]: { ...txForm, tipo: v } }))}>
                      <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aporte">Aporte</SelectItem>
                        <SelectItem value="resgate">Resgate</SelectItem>
                        <SelectItem value="rendimento">Rendimento</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" step="0.01" placeholder="Valor" value={txForm.valor || ""} onChange={(e) => setTxForms((s) => ({ ...s, [inv.id]: { ...txForm, valor: Number(e.target.value) || 0 } }))} className="h-9 w-[140px]" />
                    <Button size="sm" onClick={() => handleAddTx(inv.id)}><Plus size={14} /></Button>
                  </div>
                </div>

                {txs.length > 0 && (
                  <div className="mt-3 max-h-[180px] overflow-y-auto">
                    {txs.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                          <span className={
                            t.tipo === "resgate" ? "text-hef-warning font-semibold" :
                            t.tipo === "rendimento" ? "text-hef-info font-semibold" :
                            "text-hef-success font-semibold"
                          }>
                            {t.tipo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{brl(t.valor)}</span>
                          <button onClick={() => removeTransaction.mutate(t.id)} className="text-muted-foreground hover:text-destructive">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}