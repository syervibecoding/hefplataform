import { useState } from "react";
import { Plus, Phone, Mail, Users, MessageCircle, StickyNote, Trash2, Calendar } from "lucide-react";
import { useClientInteractions, INTERACTION_TYPES, type InteractionInsert } from "@/hooks/useClientInteractions";
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

const ICON_MAP: Record<string, React.ReactNode> = {
  Users: <Users size={14} />,
  Phone: <Phone size={14} />,
  Mail: <Mail size={14} />,
  MessageCircle: <MessageCircle size={14} />,
  StickyNote: <StickyNote size={14} />,
};

export default function InteractionTimeline({ clientId }: { clientId: string }) {
  const { interactions, isLoading, addInteraction, deleteInteraction } = useClientInteractions(clientId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<InteractionInsert>({
    client_id: clientId,
    tipo: "nota",
    titulo: "",
    descricao: "",
    data: new Date().toISOString().split("T")[0],
  });

  const handleSave = () => {
    if (!form.titulo.trim()) return;
    addInteraction.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ client_id: clientId, tipo: "nota", titulo: "", descricao: "", data: new Date().toISOString().split("T")[0] });
      },
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Timeline de Interações</p>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
          <Plus size={13} />
          Adicionar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : interactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma interação registrada</p>
      ) : (
        <div className="space-y-0">
          {interactions.map((interaction, idx) => {
            const typeInfo = INTERACTION_TYPES.find((t) => t.id === interaction.tipo);
            return (
              <div key={interaction.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${typeInfo?.color || "bg-muted text-muted-foreground"}`}>
                    {ICON_MAP[typeInfo?.icon || "StickyNote"]}
                  </div>
                  {idx < interactions.length - 1 && <div className="w-0.5 flex-1 bg-border min-h-[16px]" />}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{interaction.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[10px] ${typeInfo?.color}`}>
                          {typeInfo?.label || interaction.tipo}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Calendar size={9} />
                          {new Date(interaction.data + "T00:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteInteraction.mutate(interaction.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {interaction.descricao && (
                    <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap">{interaction.descricao}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nova Interação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea value={form.descricao || ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="mt-1 bg-secondary border-border resize-none text-sm" rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSave} disabled={!form.titulo.trim() || addInteraction.isPending}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
