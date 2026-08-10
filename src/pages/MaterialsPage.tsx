import { useState } from "react";
import { BookOpen, Link2, Video, Plus, Pencil, Trash2, ExternalLink, Search, Folder, FolderPlus, FolderOpen } from "lucide-react";
import { useMaterials, type Material, type MaterialInsert } from "@/hooks/useMaterials";
import { useMaterialFolders, type MaterialFolder } from "@/hooks/useMaterialFolders";
import { useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function MaterialCard({
  material,
  isAdmin,
  onEdit,
  onDelete,
}: {
  material: Material;
  isAdmin: boolean;
  onEdit: (m: Material) => void;
  onDelete: (id: string) => void;
}) {
  const ytId = material.tipo === "video" ? getYouTubeId(material.url) : null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col group hover:border-primary/30 transition-all hover:shadow-md">
      {/* Thumbnail */}
      {ytId ? (
        <div className="relative h-40 overflow-hidden bg-secondary">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt={material.titulo}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
              <Video size={20} className="text-primary ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-24 bg-secondary/60 flex items-center justify-center">
          <Link2 size={32} className="text-muted-foreground/40" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{material.titulo}</h3>
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              material.tipo === "video"
                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
            }`}
          >
            {material.tipo === "video" ? "Vídeo" : "Link"}
          </Badge>
        </div>

        {material.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{material.descricao}</p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border">
          {material.categoria && (
            <Badge variant="secondary" className="text-[10px]">
              {material.categoria}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(material)}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(material.id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM: MaterialInsert = {
  titulo: "",
  descricao: "",
  tipo: "link",
  url: "",
  product_id: null,
  categoria: "",
  folder_id: null,
};

const FOLDER_COLORS = ["#8b5cf6", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

export default function MaterialsPage() {
  const { isAdmin } = useAuth();
  const { products } = useProducts();
  const [productFilter, setProductFilter] = useState<string | null>(null);
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialInsert>(EMPTY_FORM);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MaterialFolder | null>(null);
  const [folderForm, setFolderForm] = useState({ nome: "", cor: FOLDER_COLORS[0] });
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const { materials, isLoading, addMaterial, editMaterial, deleteMaterial, categorias } =
    useMaterials(productFilter, categoriaFilter, folderFilter);
  const { folders, addFolder, editFolder, deleteFolder } = useMaterialFolders();

  const filtered = materials.filter(
    (m) =>
      m.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (m.descricao ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingMaterial(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditingMaterial(m);
    setForm({
      titulo: m.titulo,
      descricao: m.descricao ?? "",
      tipo: m.tipo,
      url: m.url,
      product_id: m.product_id,
      categoria: m.categoria ?? "",
      folder_id: m.folder_id ?? null,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      product_id: form.product_id || null,
      categoria: form.categoria || null,
      folder_id: form.folder_id || null,
    };
    if (editingMaterial) {
      editMaterial.mutate({ id: editingMaterial.id, data: payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      addMaterial.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMaterial.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const openAddFolder = () => {
    setEditingFolder(null);
    setFolderForm({ nome: "", cor: FOLDER_COLORS[0] });
    setFolderDialogOpen(true);
  };

  const openEditFolder = (f: MaterialFolder) => {
    setEditingFolder(f);
    setFolderForm({ nome: f.nome, cor: f.cor });
    setFolderDialogOpen(true);
  };

  const handleSaveFolder = () => {
    if (!folderForm.nome.trim()) return;
    if (editingFolder) {
      editFolder.mutate(
        { id: editingFolder.id, data: { nome: folderForm.nome.trim(), cor: folderForm.cor } },
        { onSuccess: () => setFolderDialogOpen(false) }
      );
    } else {
      addFolder.mutate(
        { nome: folderForm.nome.trim(), cor: folderForm.cor },
        { onSuccess: () => setFolderDialogOpen(false) }
      );
    }
  };

  const handleDeleteFolder = () => {
    if (!deleteFolderId) return;
    deleteFolder.mutate(deleteFolderId, {
      onSuccess: () => {
        if (folderFilter === deleteFolderId) setFolderFilter(null);
        setDeleteFolderId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Materiais</h1>
            <p className="text-xs text-muted-foreground">Biblioteca de links e vídeos da equipe</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button onClick={openAddFolder} size="sm" variant="outline" className="gap-1.5">
              <FolderPlus size={15} />
              Nova Pasta
            </Button>
            <Button onClick={openAdd} size="sm" className="gap-1.5">
              <Plus size={15} />
              Adicionar Material
            </Button>
          </div>
        )}
      </div>

      {/* Folders */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFolderFilter(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            !folderFilter
              ? "bg-primary/10 border-primary text-primary"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderOpen size={14} />
          Todas as pastas
        </button>
        {folders.map((f) => (
          <div
            key={f.id}
            className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              folderFilter === f.id
                ? "border-primary bg-primary/10"
                : "bg-secondary border-border hover:border-primary/40"
            }`}
          >
            <button
              onClick={() => setFolderFilter(folderFilter === f.id ? null : f.id)}
              className="flex items-center gap-1.5"
            >
              <Folder size={14} style={{ color: f.cor }} />
              <span>{f.nome}</span>
            </button>
            {isAdmin && (
              <span className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditFolder(f)}
                  className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => setDeleteFolderId(f.id)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            )}
          </div>
        ))}
        <button
          onClick={() => setFolderFilter(folderFilter === "__none__" ? null : "__none__")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            folderFilter === "__none__"
              ? "border-primary bg-primary/10 text-primary"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Folder size={14} />
          Sem pasta
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border text-sm"
          />
        </div>

        {/* Product filter pills */}
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

        {/* Category filter pills */}
        {categorias.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFilter(categoriaFilter === cat ? null : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  categoriaFilter === cat
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <BookOpen size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum material encontrado</p>
          {isAdmin && (
            <button onClick={openAdd} className="mt-3 text-xs text-primary hover:underline">
              Adicionar o primeiro material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "Editar Material" : "Novo Material"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="mt-1 bg-secondary border-border"
                placeholder="Nome do material"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Textarea
                value={form.descricao ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="mt-1 bg-secondary border-border resize-none text-sm"
                rows={2}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Produto</Label>
                <Select
                  value={form.product_id ?? "all"}
                  onValueChange={(v) => setForm((f) => ({ ...f, product_id: v === "all" ? null : v }))}
                >
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Geral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Geral</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="mt-1 bg-secondary border-border"
                placeholder="https://"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Input
                value={form.categoria ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className="mt-1 bg-secondary border-border"
                placeholder="Ex: Tutorial, Processo, Template"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Pasta</Label>
              <Select
                value={form.folder_id ?? "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, folder_id: v === "none" ? null : v }))}
              >
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue placeholder="Sem pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem pasta</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!form.titulo || !form.url || addMaterial.isPending || editMaterial.isPending}
              >
                {editingMaterial ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingFolder ? "Editar Pasta" : "Nova Pasta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input
                value={folderForm.nome}
                onChange={(e) => setFolderForm((f) => ({ ...f, nome: e.target.value }))}
                className="mt-1 bg-secondary border-border"
                placeholder="Ex: Onboarding, Templates"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cor</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFolderForm((f) => ({ ...f, cor: c }))}
                    className={`w-7 h-7 rounded-md border-2 transition-all ${
                      folderForm.cor === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setFolderDialogOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveFolder} disabled={!folderForm.nome.trim()}>
                {editingFolder ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete folder confirm */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={(o) => !o && setDeleteFolderId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              Os materiais dentro dela não serão excluídos — apenas ficarão sem pasta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
