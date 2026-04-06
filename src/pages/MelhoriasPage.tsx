import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusTag from "@/components/StatusTag";
import { Melhoria, MelhoriaStatus } from "@/data/constants";

interface Props {
  melhorias: Melhoria[];
  onAddMelhoria: (data: Omit<Melhoria, "id">) => void;
  onEditMelhoria: (id: string, data: Partial<Melhoria>) => void;
  onDeleteMelhoria: (id: string) => void;
  onChangeStatus: (id: string, status: MelhoriaStatus) => void;
}

const STATUS_COLUMNS: { status: MelhoriaStatus; label: string; color: string }[] = [
  { status: "backlog", label: "Backlog", color: "bg-muted-foreground/12" },
  { status: "em_desenvolvimento", label: "Em Desenvolvimento", color: "bg-hef-info/12" },
  { status: "concluido", label: "Concluído", color: "bg-hef-success/12" },
];

function MelhoriaForm({ onSubmit, initial, buttonLabel }: {
  onSubmit: (data: { titulo: string; prioridade: "alta" | "media" | "baixa"; tipo: string }) => void;
  initial?: { titulo: string; prioridade: string; tipo: string };
  buttonLabel: string;
}) {
  const [titulo, setTitulo] = useState(initial?.titulo || "");
  const [prioridade, setPrioridade] = useState(initial?.prioridade || "media");
  const [tipo, setTipo] = useState(initial?.tipo || "melhoria");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({ titulo: titulo.trim(), prioridade: prioridade as any, tipo });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div>
        <Label className="text-xs text-muted-foreground">Título</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="mt-1 bg-secondary border-border" placeholder="Descreva a melhoria..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Prioridade</Label>
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
            <option value="melhoria">Melhoria</option>
            <option value="feature">Feature</option>
            <option value="bug">Bug</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}

export default function MelhoriasPage({ melhorias, onAddMelhoria, onEditMelhoria, onDeleteMelhoria, onChangeStatus }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Melhorias & Roadmap</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
              <Plus size={14} />
              Nova Melhoria
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Nova Melhoria</DialogTitle>
            </DialogHeader>
            <MelhoriaForm
              buttonLabel="Adicionar"
              onSubmit={(data) => {
                onAddMelhoria({ ...data, status: "backlog" });
                setAddOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const items = melhorias.filter((m) => m.status === col.status);
          return (
            <div key={col.status} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="text-[11px] bg-secondary px-2 py-0.5 rounded-md font-mono">{items.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {items.map((m) => (
                  <div key={m.id} className="bg-secondary/60 border border-border/50 rounded-lg p-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{m.titulo}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            m.prioridade === "alta" ? "bg-hef-danger" : m.prioridade === "media" ? "bg-hef-warning" : "bg-hef-info"
                          }`} />
                          <span className="text-[10px] text-muted-foreground capitalize">{m.prioridade} · {m.tipo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog open={editingId === m.id} onOpenChange={(open) => setEditingId(open ? m.id : null)}>
                          <DialogTrigger asChild>
                            <button className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors">
                              <Pencil size={12} />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md bg-card border-border">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-bold">Editar Melhoria</DialogTitle>
                            </DialogHeader>
                            <MelhoriaForm
                              initial={m}
                              buttonLabel="Salvar"
                              onSubmit={(data) => {
                                onEditMelhoria(m.id, data);
                                setEditingId(null);
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <button
                          onClick={() => onDeleteMelhoria(m.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {/* Status move buttons */}
                    <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                      {STATUS_COLUMNS.filter((sc) => sc.status !== m.status).map((sc) => (
                        <button
                          key={sc.status}
                          onClick={() => onChangeStatus(m.id, sc.status)}
                          className="text-[10px] px-2 py-0.5 rounded bg-secondary hover:bg-card border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          → {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Nenhum item
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
