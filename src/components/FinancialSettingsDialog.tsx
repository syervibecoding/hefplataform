import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useFinancialSettings } from "@/hooks/useFinancialSettings";
import { useResultAllocations, ALLOCATION_COLORS, type ResultAllocation } from "@/hooks/useResultAllocations";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function FinancialSettingsDialog({ open, onOpenChange }: Props) {
  const { taxRate, setValue } = useFinancialSettings(open);
  const { allocations, create, update, remove } = useResultAllocations(open);

  const [tax, setTax] = useState<string>("6");
  const [rows, setRows] = useState<ResultAllocation[]>([]);

  useEffect(() => { if (open) setTax(String(taxRate)); }, [open, taxRate]);
  useEffect(() => { if (open) setRows(allocations); }, [open, allocations]);

  const total = rows.reduce((s, r) => s + (Number(r.percentual) || 0), 0);

  const updateRow = (id: string, patch: Partial<ResultAllocation>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = async () => {
    await create.mutateAsync({
      nome: "Nova categoria",
      percentual: 0,
      cor: ALLOCATION_COLORS[rows.length % ALLOCATION_COLORS.length].value,
      ordem: rows.length + 1,
    });
  };

  const save = async () => {
    try {
      const t = Number(tax);
      if (isNaN(t) || t < 0 || t > 100) throw new Error("Alíquota inválida");
      await setValue.mutateAsync({ key: "tax_rate", value: t });
      for (const r of rows) {
        const original = allocations.find((a) => a.id === r.id);
        if (!original) continue;
        if (
          original.nome !== r.nome ||
          Number(original.percentual) !== Number(r.percentual) ||
          original.cor !== r.cor ||
          original.ordem !== r.ordem
        ) {
          await update.mutateAsync({ ...r, percentual: Number(r.percentual) || 0 });
        }
      }
      toast({ title: "Configurações salvas" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações financeiras</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div>
            <Label className="text-xs">Alíquota de impostos (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="mt-1 max-w-[160px]"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Aplicada sobre a receita bruta para calcular o faturamento líquido.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Categorias de alocação do resultado</Label>
              <Button size="sm" variant="outline" onClick={addRow}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {rows.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">
                  Nenhuma categoria. Adicione uma para começar.
                </div>
              )}
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-2 p-2 border border-border rounded-md">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${r.cor}`} />
                  <Input
                    value={r.nome}
                    onChange={(e) => updateRow(r.id, { nome: e.target.value })}
                    className="flex-1 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={r.percentual}
                    onChange={(e) => updateRow(r.id, { percentual: Number(e.target.value) })}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <select
                    value={r.cor}
                    onChange={(e) => updateRow(r.id, { cor: e.target.value })}
                    className="h-8 text-xs bg-background border border-input rounded-md px-2"
                  >
                    {ALLOCATION_COLORS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await remove.mutateAsync(r.id);
                      setRows((prev) => prev.filter((x) => x.id !== r.id));
                    }}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <div className={`text-xs mt-2 font-mono ${Math.abs(total - 100) < 0.01 ? "text-hef-success" : "text-hef-warning"}`}>
              Total: {total.toFixed(1)}% {Math.abs(total - 100) < 0.01 ? "✓" : "(ideal: 100%)"}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
