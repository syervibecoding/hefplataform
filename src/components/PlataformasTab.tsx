import { useState } from "react";
import { Plus, Package, ExternalLink, Pencil, Trash2, Link2, FileText, KeyRound } from "lucide-react";
import { useLovableProducts, type LovableProduct } from "@/hooks/useLovableProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import PlatformEditDialog from "./PlatformEditDialog";

export default function PlataformasTab() {
  const { products, isLoading, deleteProduct } = useLovableProducts();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LovableProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return p.nome.toLowerCase().includes(s) || (p.descricao ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar plataforma..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary border-border h-9 max-w-xs"
        />
        <Button onClick={() => setCreating(true)} size="sm" className="ml-auto gap-1.5">
          <Plus size={14} /> Nova plataforma
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma plataforma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.nome}</p>
                  {p.descricao && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{p.descricao}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1"><Link2 size={11} />{(p.links ?? []).length}</span>
                {p.url_app && (
                  <a href={p.url_app} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Abrir <ExternalLink size={10} />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1 pt-2 border-t border-border mt-auto">
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setEditing(p)}>
                  <Pencil size={12} /> Gerenciar
                </Button>
                <Button size="icon" variant="ghost" className="ml-auto" onClick={() => setDeleteId(p.id)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlatformEditDialog
        platform={editing}
        isNew={creating}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plataforma?</AlertDialogTitle>
            <AlertDialogDescription>
              Os arquivos, acessos e vínculos com clientes serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteProduct.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}