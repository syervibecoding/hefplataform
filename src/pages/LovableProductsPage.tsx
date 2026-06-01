import { useMemo, useState } from "react";
import { Package, Plus, Pencil, Trash2, ExternalLink, Search, Users, X, Tag } from "lucide-react";
import { useLovableProducts, type LovableProduct, type LovableProductInsert } from "@/hooks/useLovableProducts";
import { useAllClients } from "@/hooks/useAllClients";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ativo: { label: "Ativo", cls: "bg-green-500/10 text-green-600 border-green-500/20" },
  prototipo: { label: "Protótipo", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  arquivado: { label: "Arquivado", cls: "bg-muted text-muted-foreground border-border" },
};

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const EMPTY_FORM: LovableProductInsert = {
  nome: "",
  descricao: "",
  categoria: "",
  status: "ativo",
  url_app: "",
  thumbnail_url: "",
  video_demo_url: "",
  stack: [],
  cliente_origem_id: null,
  tags: [],
};

export default function LovableProductsPage() {
  const {
    products,
    isLoading,
    addProduct,
    editProduct,
    deleteProduct,
    clientIdsFor,
    renameCategory,
  } = useLovableProducts();
  const { data: clients = [] } = useAllClients();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LovableProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LovableProduct | null>(null);
  const [form, setForm] = useState<LovableProductInsert>(EMPTY_FORM);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoria).filter(Boolean))) as string[],
    [products]
  );

  const filtered = products.filter((p) => {
    if (categoryFilter && p.categoria !== categoryFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    const s = search.toLowerCase();
    if (!s) return true;
    return (
      p.nome.toLowerCase().includes(s) ||
      (p.descricao ?? "").toLowerCase().includes(s) ||
      p.tags.some((t) => t.toLowerCase().includes(s))
    );
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedClients([]);
    setStackInput("");
    setTagInput("");
    setDialogOpen(true);
  };

  const openEdit = (p: LovableProduct) => {
    setEditing(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? "",
      categoria: p.categoria ?? "",
      status: p.status,
      url_app: p.url_app ?? "",
      thumbnail_url: p.thumbnail_url ?? "",
      video_demo_url: p.video_demo_url ?? "",
      stack: p.stack ?? [],
      cliente_origem_id: p.cliente_origem_id,
      tags: p.tags ?? [],
    });
    setSelectedClients(clientIdsFor(p.id));
    setStackInput("");
    setTagInput("");
    setDialogOpen(true);
    setDetail(null);
  };

  const handleSave = () => {
    const payload: LovableProductInsert = {
      ...form,
      descricao: form.descricao || null,
      categoria: form.categoria || null,
      url_app: form.url_app || null,
      thumbnail_url: form.thumbnail_url || null,
      video_demo_url: form.video_demo_url || null,
      cliente_origem_id: form.cliente_origem_id || null,
    };
    if (editing) {
      editProduct.mutate(
        { id: editing.id, values: payload, clientIds: selectedClients },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      addProduct.mutate(
        { values: payload, clientIds: selectedClients },
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const toggleClient = (id: string) =>
    setSelectedClients((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));

  const addChip = (kind: "stack" | "tags", value: string) => {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [kind]: Array.from(new Set([...(f[kind] as string[]), v])) }));
    if (kind === "stack") setStackInput("");
    else setTagInput("");
  };

  const removeChip = (kind: "stack" | "tags", value: string) =>
    setForm((f) => ({ ...f, [kind]: (f[kind] as string[]).filter((v) => v !== value) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Produtos Lovable</h1>
            <p className="text-xs text-muted-foreground">Biblioteca de apps construídos para clientes</p>
          </div>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus size={15} />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(["ativo", "prototipo", "arquivado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? null : s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <div
                key={c}
                className={`group flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  categoryFilter === c
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <button onClick={() => setCategoryFilter(categoryFilter === c ? null : c)}>
                  {c}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingCategory(c);
                    setRenameValue(c);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-background/50 transition-opacity"
                  title="Renomear categoria"
                >
                  <Pencil size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename category dialog */}
      <Dialog open={!!renamingCategory} onOpenChange={(o) => !o && setRenamingCategory(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Tag size={15} /> Renomear categoria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <div>
              <Label className="text-xs text-muted-foreground">Novo nome</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="mt-1 bg-secondary border-border"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Todos os produtos com "{renamingCategory}" serão atualizados.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setRenamingCategory(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const newName = renameValue.trim();
                  if (!newName || !renamingCategory || newName === renamingCategory) {
                    setRenamingCategory(null);
                    return;
                  }
                  renameCategory.mutate(
                    { oldName: renamingCategory, newName },
                    {
                      onSuccess: () => {
                        if (categoryFilter === renamingCategory) setCategoryFilter(newName);
                        setRenamingCategory(null);
                      },
                    }
                  );
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Package size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum produto cadastrado</p>
          <button onClick={openAdd} className="mt-3 text-xs text-primary hover:underline">
            Cadastrar o primeiro produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => {
            const count = clientIdsFor(p.id).length;
            const meta = STATUS_META[p.status] ?? STATUS_META.ativo;
            return (
              <button
                key={p.id}
                onClick={() => setDetail(p)}
                className="bg-card border border-border rounded-xl overflow-hidden flex flex-col text-left hover:border-primary/30 transition-all hover:shadow-md"
              >
                {p.thumbnail_url ? (
                  <div className="h-36 bg-secondary overflow-hidden">
                    <img src={p.thumbnail_url} alt={p.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-36 bg-secondary/60 flex items-center justify-center">
                    <Package size={32} className="text-muted-foreground/40" />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{p.nome}</h3>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.cls}`}>
                      {meta.label}
                    </Badge>
                  </div>
                  {p.descricao && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
                    {p.categoria ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {p.categoria}
                      </Badge>
                    ) : <span />}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users size={12} />
                      {count} {count === 1 ? "cliente" : "clientes"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg">{detail.nome}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className={`text-[10px] ${(STATUS_META[detail.status] ?? STATUS_META.ativo).cls}`}>
                        {(STATUS_META[detail.status] ?? STATUS_META.ativo).label}
                      </Badge>
                      {detail.categoria && (
                        <Badge variant="secondary" className="text-[10px]">{detail.categoria}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(detail)}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { setDeleteId(detail.id); setDetail(null); }}
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {detail.descricao && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.descricao}</p>
                )}

                {detail.video_demo_url && getYouTubeId(detail.video_demo_url) ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(detail.video_demo_url)}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : detail.video_demo_url ? (
                  <a href={detail.video_demo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Ver demo <ExternalLink size={12} />
                  </a>
                ) : null}

                {detail.url_app && (
                  <a
                    href={detail.url_app}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    Abrir app <ExternalLink size={13} />
                  </a>
                )}

                {detail.stack.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Stack / Integrações</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {detail.stack.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detail.tags.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {detail.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Clientes que usam ({clientIdsFor(detail.id).length})</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {clientIdsFor(detail.id).map((cid) => {
                      const c = clients.find((x) => x.id === cid);
                      return (
                        <Badge key={cid} variant="outline" className="text-[11px]">
                          {c?.nome ?? cid.slice(0, 8)}
                        </Badge>
                      );
                    })}
                    {clientIdsFor(detail.id).length === 0 && (
                      <span className="text-xs text-muted-foreground">Nenhum cliente vinculado</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto Lovable"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Textarea
                  value={form.descricao ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="mt-1 bg-secondary border-border resize-none text-sm"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Input
                  value={form.categoria ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  placeholder="CRM, Dashboard, Automação..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="prototipo">Protótipo</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL do app</Label>
                <Input
                  value={form.url_app ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, url_app: e.target.value }))}
                  placeholder="https://"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Thumbnail (URL)</Label>
                <Input
                  value={form.thumbnail_url ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Vídeo demo (YouTube/Loom)</Label>
                <Input
                  value={form.video_demo_url ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, video_demo_url: e.target.value }))}
                  placeholder="https://"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Cliente de origem</Label>
                <Select
                  value={form.cliente_origem_id ?? "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, cliente_origem_id: v === "none" ? null : v }))}
                >
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Stack / Integrações</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {form.stack.map((s) => (
                    <Badge key={s} variant="outline" className="text-[11px] gap-1 pr-1">
                      {s}
                      <button onClick={() => removeChip("stack", s)} className="hover:text-destructive">
                        <X size={11} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("stack", stackInput); } }}
                  placeholder="Digite e pressione Enter (ex: Supabase, n8n, Stripe)"
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[11px] gap-1 pr-1">
                      #{t}
                      <button onClick={() => removeChip("tags", t)} className="hover:text-destructive">
                        <X size={11} />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("tags", tagInput); } }}
                  placeholder="Digite e pressione Enter"
                  className="mt-2 bg-secondary border-border"
                />
              </div>

              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Clientes vinculados</Label>
                <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-border bg-secondary/40 p-2 flex flex-wrap gap-1.5">
                  {clients.length === 0 && (
                    <span className="text-xs text-muted-foreground">Nenhum cliente cadastrado</span>
                  )}
                  {clients.map((c) => {
                    const sel = selectedClients.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleClient(c.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                          sel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.nome || addProduct.isPending || editProduct.isPending}
              >
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação remove o produto e todos os vínculos com clientes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteProduct.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
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