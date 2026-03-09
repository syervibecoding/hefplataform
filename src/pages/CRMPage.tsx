import { useState, useRef } from "react";
import {
  TrendingUp,
  Plus,
  LayoutGrid,
  List,
  X,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  GripVertical,
  Settings2,
} from "lucide-react";
import { useProspects, type Prospect, type ProspectInsert } from "@/hooks/useProspects";
import { useCRMStages } from "@/hooks/useCRMStages";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const formatCurrency = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ORIGENS = ["Indicação", "Instagram", "LinkedIn", "Google", "Site", "WhatsApp", "Evento", "Outro"];

const EMPTY_FORM: ProspectInsert = {
  nome: "",
  contato: "",
  whatsapp: "",
  email: "",
  product_id: null,
  status: "novo_lead",
  origem: null,
  valor_estimado: null,
  notas: "",
  data_contato: null,
  data_followup: null,
};

function StageColor({ status, stages }: { status: string; stages: { id: string; label: string; color: string }[] }) {
  const stage = stages.find((s) => s.id === status);
  return (
    <Badge variant="outline" className={`text-[10px] ${stage?.color ?? ""}`}>
      {stage?.label ?? status}
    </Badge>
  );
}

function KanbanCard({
  prospect,
  onClick,
  onDragStart,
}: {
  prospect: Prospect;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <p className="font-semibold text-sm mb-1 truncate">{prospect.nome}</p>
      {prospect.contato && (
        <p className="text-xs text-muted-foreground mb-2 truncate">{prospect.contato}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        {prospect.valor_estimado ? (
          <span className="text-xs font-medium text-green-600">{formatCurrency(prospect.valor_estimado)}</span>
        ) : <span />}
        {prospect.data_followup && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Calendar size={9} />
            {new Date(prospect.data_followup + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CRMPage() {
  const { products } = useProducts();
  const { stages, addStage, deleteStage, reorderStages } = useCRMStages();
  const [productFilter, setProductFilter] = useState<string | null>(null);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProspectInsert>(EMPTY_FORM);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const [stageManageOpen, setStageManageOpen] = useState(false);
  const [newStageLabel, setNewStageLabel] = useState("");
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const { prospects, isLoading, addProspect, editProspect, deleteProspect, moveProspect } =
    useProspects(productFilter);


  // First stage (position 0) = leads frios
  const firstStageId = stages.length > 0 ? stages[0]?.id : null;
  const lastStageId = stages.length > 0 ? stages[stages.length - 1]?.id : null;

  const leadsFrios = prospects.filter((p) => p.status === firstStageId);
  const convertidos = prospects.filter((p) => p.status === "ganho" || p.status === lastStageId);
  const perdidos = prospects.filter((p) => p.status === "perdido");
  const geladeira = prospects.filter((p) => p.status === "geladeira");

  const totalPipeline = prospects
    .filter((p) => p.status !== "perdido" && p.status !== firstStageId && p.status !== "geladeira")
    .reduce((s, p) => s + (p.valor_estimado ?? 0), 0);

  const prospectsAtivos = prospects.filter((p) => 
    p.status !== firstStageId && 
    p.status !== "perdido" && 
    p.status !== "geladeira"
  );
  const taxaConversao = prospectsAtivos.length > 0
    ? Math.round((convertidos.length / prospectsAtivos.length) * 100)
    : 0;

  const openAdd = () => {
    setEditingProspect(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Prospect) => {
    setEditingProspect(p);
    setForm({
      nome: p.nome,
      contato: p.contato ?? "",
      whatsapp: p.whatsapp ?? "",
      email: p.email ?? "",
      product_id: p.product_id,
      status: p.status,
      origem: p.origem,
      valor_estimado: p.valor_estimado,
      notas: p.notas ?? "",
      data_contato: p.data_contato,
      data_followup: p.data_followup,
    });
    setDialogOpen(true);
    setSelectedProspect(null);
  };

  const handleSave = () => {
    const payload = { ...form, product_id: form.product_id || null };
    if (editingProspect) {
      editProspect.mutate({ id: editingProspect.id, data: payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      addProspect.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProspect.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          setSelectedProspect(null);
        },
      });
    }
  };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragId.current) {
      moveProspect.mutate({ id: dragId.current, status: stageId });
      dragId.current = null;
    }
    setDragOverStage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">CRM de Prospecção</h1>
            <p className="text-xs text-muted-foreground">Acompanhe o funil de vendas</p>
          </div>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus size={15} />
          Adicionar Prospect
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total de Prospects</p>
          <p className="text-2xl font-bold mt-0.5">{prospects.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Leads Frios</p>
          <p className="text-2xl font-bold mt-0.5 text-blue-500">{leadsFrios.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Valor do Pipeline</p>
          <p className="text-2xl font-bold mt-0.5 text-green-600">{formatCurrency(totalPipeline)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Exclui leads frios e perdidos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Convertidos</p>
          <p className="text-2xl font-bold mt-0.5 text-green-500">{convertidos.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
          <p className="text-2xl font-bold mt-0.5 text-primary">{taxaConversao}%</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Product filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setProductFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              !productFilter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setProductFilter(productFilter === p.id ? null : p.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                productFilter === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.nome}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setStageManageOpen(true)}>
            <Settings2 size={14} />
            Etapas
          </Button>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded-md transition-all ${view === "kanban" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-1.5 rounded-md transition-all ${view === "table" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {stages.map((stage) => {
            const stageProspects = prospects.filter((p) => p.status === stage.id);
            const isOver = dragOverStage === stage.id;
            return (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-52 rounded-xl border transition-all ${
                  isOver ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/40"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id); }}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{stage.label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-1 shrink-0">
                      {stageProspects.length}
                    </Badge>
                  </div>
                  {stageProspects.reduce((s, p) => s + (p.valor_estimado ?? 0), 0) > 0 && (
                    <p className="text-[10px] text-green-600 font-medium mt-1">
                      {formatCurrency(stageProspects.reduce((s, p) => s + (p.valor_estimado ?? 0), 0))}
                    </p>
                  )}
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {stageProspects.map((p) => (
                    <KanbanCard
                      key={p.id}
                      prospect={p}
                      onClick={() => setSelectedProspect(p)}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Produto</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Etapa</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Valor</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Follow-up</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => {
                const prod = products.find((pr) => pr.id === p.product_id);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedProspect(p)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{p.nome}</p>
                      {p.contato && <p className="text-xs text-muted-foreground">{p.contato}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{prod?.nome ?? "—"}</td>
                    <td className="px-4 py-3"><StageColor status={p.status} stages={stages} /></td>
                    <td className="px-4 py-3 text-xs font-medium">{formatCurrency(p.valor_estimado)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.data_followup
                        ? new Date(p.data_followup + "T00:00:00").toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
              {prospects.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhum prospect encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedProspect} onOpenChange={(o) => !o && setSelectedProspect(null)}>
        <SheetContent className="bg-card border-border w-full max-w-sm overflow-y-auto">
          {selectedProspect && (
            <>
              <SheetHeader className="pb-4 border-b border-border">
                <SheetTitle className="text-base font-bold">{selectedProspect.nome}</SheetTitle>
                <StageColor status={selectedProspect.status} stages={stages} />
              </SheetHeader>
              <div className="py-4 space-y-4">
                {selectedProspect.contato && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Responsável</p>
                    <p className="text-sm font-medium">{selectedProspect.contato}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {selectedProspect.whatsapp && (
                    <a href={`https://wa.me/${selectedProspect.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Phone size={13} />{selectedProspect.whatsapp}
                    </a>
                  )}
                  {selectedProspect.email && (
                    <a href={`mailto:${selectedProspect.email}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Mail size={13} />{selectedProspect.email}
                    </a>
                  )}
                </div>

                {selectedProspect.valor_estimado != null && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Valor Estimado</p>
                    <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedProspect.valor_estimado)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {selectedProspect.data_contato && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Primeiro Contato</p>
                      <p className="text-xs flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(selectedProspect.data_contato + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                  {selectedProspect.data_followup && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Follow-up</p>
                      <p className="text-xs flex items-center gap-1 text-orange-500 font-medium">
                        <Calendar size={11} />
                        {new Date(selectedProspect.data_followup + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}
                </div>

                {selectedProspect.origem && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Origem</p>
                    <Badge variant="secondary" className="text-xs">{selectedProspect.origem}</Badge>
                  </div>
                )}

                {selectedProspect.notas && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
                    <p className="text-sm text-muted-foreground bg-secondary/60 rounded-lg p-3 whitespace-pre-wrap">
                      {selectedProspect.notas}
                    </p>
                  </div>
                )}

                {/* Mover etapa */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Mover para etapa</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stages.map((s) => (
                      <button
                        key={s.id}
                        disabled={s.id === selectedProspect.status}
                        onClick={() => {
                          moveProspect.mutate({ id: selectedProspect.id, status: s.id });
                          setSelectedProspect({ ...selectedProspect, status: s.id });
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all disabled:opacity-50 ${
                          s.id === selectedProspect.status
                            ? `${s.color} border-current`
                            : "border-border bg-secondary hover:bg-card"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => openEdit(selectedProspect)}
                >
                  <Pencil size={13} />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                  onClick={() => { setDeleteId(selectedProspect.id); setSelectedProspect(null); }}
                >
                  <Trash2 size={13} />
                  Excluir
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProspect ? "Editar Prospect" : "Novo Prospect"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Nome / Empresa *</Label>
                <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Responsável</Label>
                <Input value={form.contato ?? ""} onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">WhatsApp</Label>
                <Input value={form.whatsapp ?? ""} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="mt-1 bg-secondary border-border" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">E-mail</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Produto</Label>
                <Select value={form.product_id ?? "all"} onValueChange={(v) => setForm((f) => ({ ...f, product_id: v === "all" ? null : v }))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">—</SelectItem>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Etapa do Funil</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Origem</Label>
                <Select value={form.origem ?? "none"} onValueChange={(v) => setForm((f) => ({ ...f, origem: v === "none" ? null : v }))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Valor Estimado (R$)</Label>
                <Input
                  type="number"
                  value={form.valor_estimado ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, valor_estimado: e.target.value ? Number(e.target.value) : null }))}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data do Contato</Label>
                <Input type="date" value={form.data_contato ?? ""} onChange={(e) => setForm((f) => ({ ...f, data_contato: e.target.value || null }))} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data Follow-up</Label>
                <Input type="date" value={form.data_followup ?? ""} onChange={(e) => setForm((f) => ({ ...f, data_followup: e.target.value || null }))} className="mt-1 bg-secondary border-border" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Notas</Label>
                <Textarea value={form.notas ?? ""} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} className="mt-1 bg-secondary border-border resize-none text-sm" rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={!form.nome || addProspect.isPending || editProspect.isPending}>
                {editingProspect ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prospect?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stage Management Dialog */}
      <Dialog open={stageManageOpen} onOpenChange={setStageManageOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Gerenciar Etapas do Funil</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-3">Arraste para reordenar. Clique no X para remover.</p>
          <div className="space-y-1.5 mb-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => setDragColumnId(stage.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumnId(stage.id); }}
                onDragEnd={() => { setDragColumnId(null); setDragOverColumnId(null); }}
                onDrop={() => {
                  if (dragColumnId && dragColumnId !== stage.id) {
                    const ids = stages.map((s) => s.id);
                    const fromIdx = ids.indexOf(dragColumnId);
                    const toIdx = ids.indexOf(stage.id);
                    ids.splice(fromIdx, 1);
                    ids.splice(toIdx, 0, dragColumnId);
                    reorderStages.mutate(ids);
                  }
                  setDragColumnId(null);
                  setDragOverColumnId(null);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                  dragOverColumnId === stage.id ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/40"
                }`}
              >
                <GripVertical size={14} className="text-muted-foreground shrink-0" />
                <Badge variant="outline" className={`text-xs ${stage.color}`}>{stage.label}</Badge>
                <span className="flex-1" />
                <button
                  onClick={() => deleteStage.mutate(stage.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da nova etapa..."
              value={newStageLabel}
              onChange={(e) => setNewStageLabel(e.target.value)}
              className="bg-secondary border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newStageLabel.trim()) {
                  addStage.mutate(newStageLabel.trim(), { onSuccess: () => setNewStageLabel("") });
                }
              }}
            />
            <Button
              size="sm"
              disabled={!newStageLabel.trim() || addStage.isPending}
              onClick={() => addStage.mutate(newStageLabel.trim(), { onSuccess: () => setNewStageLabel("") })}
            >
              <Plus size={14} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
