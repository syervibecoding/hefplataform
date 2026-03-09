import { useState, useRef } from "react";
import { Plus, X, Calendar, DollarSign } from "lucide-react";
import { useRenewalPipeline, RENEWAL_STAGES, type RenewalInsert } from "@/hooks/useRenewalPipeline";
import { type ClientRow } from "@/hooks/useAllClients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatCurrency = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  clients: ClientRow[];
}

export default function RenewalPipelineBoard({ clients }: Props) {
  const { renewals, isLoading, addRenewal, moveRenewal, deleteRenewal } = useRenewalPipeline();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const [form, setForm] = useState<RenewalInsert>({
    client_id: "",
    status: "renovar",
    data_vencimento: null,
    valor_renovacao: null,
    notas: null,
  });

  // Clients not already in the pipeline
  const clientsInPipeline = new Set(renewals.map((r) => r.client_id));
  const availableClients = clients.filter((c) => !clientsInPipeline.has(c.id));

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragId.current) {
      moveRenewal.mutate({ id: dragId.current, status: stageId });
      dragId.current = null;
    }
    setDragOverStage(null);
  };

  const handleSave = () => {
    if (!form.client_id) return;
    addRenewal.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ client_id: "", status: "renovar", data_vencimento: null, valor_renovacao: null, notas: null });
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Pipeline de Renovação</p>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setDialogOpen(true)} disabled={availableClients.length === 0}>
          <Plus size={13} />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {RENEWAL_STAGES.map((stage) => {
            const stageRenewals = renewals.filter((r) => r.status === stage.id);
            const isOver = dragOverStage === stage.id;
            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-56 rounded-xl border transition-all ${
                  isOver ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/40"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-xs ${stage.color}`}>{stage.label}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{stageRenewals.length}</Badge>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[80px]">
                  {stageRenewals.map((renewal) => {
                    const client = clients.find((c) => c.id === renewal.client_id);
                    return (
                      <div
                        key={renewal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, renewal.id)}
                        className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-semibold truncate">{client?.nome || "?"}</p>
                          <button onClick={() => deleteRenewal.mutate(renewal.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5 shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                        {renewal.valor_renovacao && (
                          <p className="text-xs font-medium text-green-600 mt-1 flex items-center gap-1">
                            <DollarSign size={10} />
                            {formatCurrency(renewal.valor_renovacao)}
                          </p>
                        )}
                        {renewal.data_vencimento && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                            <Calendar size={9} />
                            {new Date(renewal.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Adicionar ao Pipeline de Renovação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Cliente *</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v === "none" ? "" : v }))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Selecione...</SelectItem>
                  {availableClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Etapa</Label>
              <Select value={form.status || "renovar"} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RENEWAL_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
              <Input type="date" value={form.data_vencimento || ""} onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value || null }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor de Renovação (R$)</Label>
              <Input type="number" value={form.valor_renovacao ?? ""} onChange={(e) => setForm((f) => ({ ...f, valor_renovacao: e.target.value ? Number(e.target.value) : null }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Notas</Label>
              <Textarea value={form.notas || ""} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value || null }))} className="mt-1 bg-secondary border-border resize-none text-sm" rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={!form.client_id || addRenewal.isPending}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
