import { useState, useEffect } from "react";
import { Users, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useConsultants, CONSULTANT_COLORS } from "@/hooks/useConsultants";
import { toast } from "sonner";

export default function ConsultantManagerDialog() {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; display_name: string | null; username: string }[]>([]);
  const [newProfileId, setNewProfileId] = useState("");
  const [newColor, setNewColor] = useState(CONSULTANT_COLORS[0].value);

  const { consultants, addConsultant, updateConsultant, deleteConsultant } = useConsultants();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("profiles")
      .select("id, display_name, username")
      .then(({ data }) => setProfiles((data as any) || []));
  }, [open]);

  const availableProfiles = profiles.filter(
    (p) => !consultants.some((c) => c.profileId === p.id),
  );

  const handleAdd = async () => {
    if (!newProfileId) {
      toast.error("Selecione um usuário");
      return;
    }
    try {
      await addConsultant.mutateAsync({ profileId: newProfileId, cor: newColor });
      setNewProfileId("");
      toast.success("Consultor adicionado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao adicionar consultor");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:bg-secondary/70 transition-all">
          <Users size={14} />
          Consultores
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Consultores</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {consultants.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum consultor cadastrado.</p>
          )}
          {consultants.map((c) => (
            <div key={c.id} className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg">
              <div className={`w-3 h-3 rounded ${c.cor.split(" ")[0]}`} />
              <span className="text-sm font-medium flex-1">{c.displayName}</span>
              <select
                value={c.cor}
                onChange={(e) => updateConsultant.mutate({ id: c.id, cor: e.target.value })}
                className="h-7 text-[11px] rounded border border-border bg-secondary px-2"
              >
                {CONSULTANT_COLORS.map((col) => (
                  <option key={col.value} value={col.value}>{col.label}</option>
                ))}
              </select>
              <button
                onClick={() => deleteConsultant.mutate(c.id)}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <div className="pt-3 border-t border-border space-y-2">
            <Label className="text-xs text-muted-foreground">Adicionar consultor</Label>
            <div className="flex gap-2">
              <select
                value={newProfileId}
                onChange={(e) => setNewProfileId(e.target.value)}
                className="flex-1 h-9 rounded-md border border-border bg-secondary px-2 text-sm"
              >
                <option value="">Selecione um usuário…</option>
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.display_name || p.username}</option>
                ))}
              </select>
              <select
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-9 rounded-md border border-border bg-secondary px-2 text-sm"
              >
                {CONSULTANT_COLORS.map((col) => (
                  <option key={col.value} value={col.value}>{col.label}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                className="px-3 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all inline-flex items-center gap-1"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}