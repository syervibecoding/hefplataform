import { useState, useRef } from "react";
import { Plus, GripVertical, MoreHorizontal, Trash2, Edit2, Calendar as CalendarIcon, Flag, X, Settings2, User } from "lucide-react";
import { usePlanningColumns, type PlanningColumn } from "@/hooks/usePlanningColumns";
import { usePlanningTasks, type PlanningTask } from "@/hooks/usePlanningTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-slate-500/15 text-slate-400" },
  media: { label: "Média", color: "bg-blue-500/15 text-blue-400" },
  alta: { label: "Alta", color: "bg-amber-500/15 text-amber-400" },
  urgente: { label: "Urgente", color: "bg-red-500/15 text-red-400" },
};

const COLUMN_COLORS = [
  "bg-blue-500/15 text-blue-600",
  "bg-amber-500/15 text-amber-600",
  "bg-orange-500/15 text-orange-600",
  "bg-slate-500/15 text-slate-500",
  "bg-emerald-500/15 text-emerald-600",
  "bg-purple-500/15 text-purple-600",
  "bg-rose-500/15 text-rose-600",
  "bg-cyan-500/15 text-cyan-600",
];

export default function WorkflowPage() {
  const { isAdmin } = useAuth();
  const { columns, addColumn, updateColumn, deleteColumn, reorderColumns } = usePlanningColumns();
  const { tasks, addTask, updateTask, deleteTask, moveTask } = usePlanningTasks();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, username, display_name");
      if (error) throw error;
      return data;
    },
  });

  const getProfileName = (userId: string | null) => {
    if (!userId) return null;
    const p = profiles.find(p => p.id === userId);
    return p?.display_name || p?.username || null;
  };

  const getProfileInitials = (userId: string | null) => {
    const name = getProfileName(userId);
    if (!name) return "?";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState("");
  const [editingTask, setEditingTask] = useState<PlanningTask | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "media", due_date: "", labels: "" });
  const [newColumn, setNewColumn] = useState({ label: "", color: COLUMN_COLORS[0] });

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const handleAddTask = () => {
    if (!newTask.title || !targetColumnId) return;
    addTask.mutate({
      title: newTask.title,
      column_id: targetColumnId,
      description: newTask.description || undefined,
      priority: newTask.priority,
      due_date: newTask.due_date || undefined,
      labels: newTask.labels ? newTask.labels.split(",").map(l => l.trim()).filter(Boolean) : undefined,
    });
    setNewTask({ title: "", description: "", priority: "media", due_date: "", labels: "" });
    setAddTaskDialogOpen(false);
  };

  const handleEditTask = () => {
    if (!editingTask) return;
    updateTask.mutate({
      id: editingTask.id,
      data: {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        labels: editingTask.labels,
      },
    });
    setEditTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleAddColumn = () => {
    if (!newColumn.label) return;
    addColumn.mutate(newColumn);
    setNewColumn({ label: "", color: COLUMN_COLORS[0] });
    setAddColumnDialogOpen(false);
  };

  // Task drag handlers
  const onTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const onTaskDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumnId(columnId);
  };

  const onTaskDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId && draggedTaskId) {
      const tasksInCol = tasks.filter(t => t.column_id === columnId);
      moveTask.mutate({ taskId, newColumnId: columnId, newPosition: tasksInCol.length });
    }
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  // Column drag handlers
  const onColDragStart = (e: React.DragEvent, colId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("col-id", colId);
    setDraggedColId(colId);
  };

  const onColDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedColId && draggedColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const onColDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedColId || draggedColId === targetColId) return;
    const ids = columns.map(c => c.id);
    const fromIdx = ids.indexOf(draggedColId);
    const toIdx = ids.indexOf(targetColId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newOrder = [...ids];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedColId);
    reorderColumns.mutate(newOrder);
    setDraggedColId(null);
    setDragOverColId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Planning Semanal</h2>
          <p className="text-xs text-muted-foreground">Organize suas tarefas da semana no quadro Kanban</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setManageColumnsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border hover:bg-secondary/80 transition-colors"
            >
              <Settings2 size={14} />
              Colunas
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setAddColumnDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary border border-border hover:bg-secondary/80 transition-colors"
            >
              <Plus size={14} />
              Nova Coluna
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.column_id === col.id).sort((a, b) => a.position - b.position);
          const isDragOver = dragOverColumnId === col.id && draggedTaskId;
          const isColDragOver = dragOverColId === col.id && draggedColId;

          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-all ${
                isColDragOver ? "border-primary/50 bg-primary/5" : "border-border bg-card/50"
              }`}
              draggable={isAdmin}
              onDragStart={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).closest("[data-col-handle]")) {
                  onColDragStart(e, col.id);
                }
              }}
              onDragOver={(e) => {
                if (draggedColId) {
                  onColDragOver(e, col.id);
                } else {
                  onTaskDragOver(e, col.id);
                }
              }}
              onDrop={(e) => {
                if (draggedColId) {
                  onColDrop(e, col.id);
                } else {
                  onTaskDrop(e, col.id);
                }
              }}
              onDragEnd={() => {
                setDraggedColId(null);
                setDragOverColId(null);
              }}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <GripVertical size={14} className="text-muted-foreground cursor-grab" data-col-handle />
                  )}
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => { setTargetColumnId(col.id); setAddTaskDialogOpen(true); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Tasks */}
              <div className={`flex-1 p-2 space-y-2 overflow-y-auto transition-colors ${isDragOver ? "bg-primary/5" : ""}`}>
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); onTaskDragStart(e, task.id); }}
                    onDragEnd={() => { setDraggedTaskId(null); setDragOverColumnId(null); }}
                    className={`group bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all ${
                      draggedTaskId === task.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-tight flex-1">{task.title}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center hover:bg-secondary transition-all">
                            <MoreHorizontal size={12} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => { setEditingTask(task); setEditTaskDialogOpen(true); }}>
                            <Edit2 size={12} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteTask.mutate(task.id)}>
                            <Trash2 size={12} className="mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {task.priority && task.priority !== "media" && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_MAP[task.priority]?.color || ""}`}>
                          <Flag size={8} />
                          {PRIORITY_MAP[task.priority]?.label}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground">
                          <CalendarIcon size={8} />
                          {new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </span>
                      )}
                      {task.labels?.map((label) => (
                        <Badge key={label} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{label}</Badge>
                      ))}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && !isDragOver && (
                  <div className="text-center py-8">
                    <p className="text-[11px] text-muted-foreground/50">Arraste tarefas aqui</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Título</Label>
              <Input value={newTask.title} onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))} className="mt-1 bg-secondary border-border" placeholder="O que precisa ser feito?" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea value={newTask.description} onChange={(e) => setNewTask(p => ({ ...p, description: e.target.value }))} className="mt-1 bg-secondary border-border min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prazo</Label>
                <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask(p => ({ ...p, due_date: e.target.value }))} className="mt-1 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Labels (separadas por vírgula)</Label>
              <Input value={newTask.labels} onChange={(e) => setNewTask(p => ({ ...p, labels: e.target.value }))} className="mt-1 bg-secondary border-border" placeholder="frontend, bug, review" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddTaskDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={handleAddTask} disabled={!newTask.title} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50">Criar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Editar Tarefa</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Título</Label>
                <Input value={editingTask.title} onChange={(e) => setEditingTask(p => p ? { ...p, title: e.target.value } : p)} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea value={editingTask.description || ""} onChange={(e) => setEditingTask(p => p ? { ...p, description: e.target.value } : p)} className="mt-1 bg-secondary border-border min-h-[60px]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Prioridade</Label>
                  <Select value={editingTask.priority} onValueChange={(v) => setEditingTask(p => p ? { ...p, priority: v } : p)}>
                    <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Prazo</Label>
                  <Input type="date" value={editingTask.due_date || ""} onChange={(e) => setEditingTask(p => p ? { ...p, due_date: e.target.value || null } : p)} className="mt-1 bg-secondary border-border" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Labels (separadas por vírgula)</Label>
                <Input value={editingTask.labels?.join(", ") || ""} onChange={(e) => setEditingTask(p => p ? { ...p, labels: e.target.value.split(",").map(l => l.trim()).filter(Boolean) } : p)} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mover para</Label>
                <Select value={editingTask.column_id} onValueChange={(v) => setEditingTask(p => p ? { ...p, column_id: v } : p)}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditTaskDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
                <button onClick={handleEditTask} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110">Salvar</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialogOpen} onOpenChange={setAddColumnDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Nova Coluna</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={newColumn.label} onChange={(e) => setNewColumn(p => ({ ...p, label: e.target.value }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cor</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLUMN_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewColumn(p => ({ ...p, color: c }))} className={`px-3 py-1 rounded-md text-[11px] font-bold border transition-all ${c} ${newColumn.color === c ? "ring-2 ring-primary" : "border-transparent"}`}>
                    Aa
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddColumnDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={handleAddColumn} disabled={!newColumn.label} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50">Criar</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Columns Dialog */}
      <Dialog open={manageColumnsOpen} onOpenChange={setManageColumnsOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Gerenciar Colunas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {columns.map((col, idx) => (
              <div key={col.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex-1 ${col.color}`}>{col.label}</span>
                <button
                  onClick={() => deleteColumn.mutate(col.id)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {columns.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma coluna criada</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
