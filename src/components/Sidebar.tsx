import { LayoutDashboard, Users, Calendar, Activity, Rocket, Settings, ChevronDown, LogOut, UserCog, Plus, BookOpen, TrendingUp, Pencil, Trash2, Globe, Wallet, Package } from "lucide-react";
import { useState } from "react";
import logoHef from "@/assets/logo-hefsys.png";
import { type ProductId } from "@/data/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts, type Product } from "@/hooks/useProducts";
import { getIcon, AVAILABLE_ICONS } from "@/lib/icon-map";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  activeProduct: ProductId;
  onChangeProduct: (product: ProductId) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "calendar", label: "Calendário", icon: Calendar },
  { id: "workflow", label: "Planning", icon: Activity },
  { id: "materials", label: "Materiais", icon: BookOpen },
  { id: "lovable-products", label: "Produtos Lovable", icon: Package },
  { id: "crm", label: "CRM", icon: TrendingUp },
  { id: "melhorias", label: "Melhorias", icon: Rocket },
];

export default function Sidebar({ activePage, onNavigate, activeProduct, onChangeProduct }: SidebarProps) {
  const { profile, isAdmin, signOut } = useAuth();
  const { products, addProduct, editProduct, deleteProduct } = useProducts();
  const [productOpen, setProductOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ id: "", nome: "", descricao: "", icon: "Box" });

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const currentProduct = products.find((p) => p.id === activeProduct);
  const CurrentIcon = currentProduct ? getIcon(currentProduct.icon) : LayoutDashboard;

  const handleAddProduct = () => {
    if (!newProduct.nome) return;
    const slug = newProduct.nome.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    addProduct.mutate({
      id: slug,
      nome: newProduct.nome,
      descricao: newProduct.descricao,
      icon: newProduct.icon,
      position: products.length,
    });
    setNewProduct({ id: "", nome: "", descricao: "", icon: "Box" });
    setAddDialogOpen(false);
  };

  const handleEditProduct = () => {
    if (!editingProduct) return;
    editProduct.mutate({
      id: editingProduct.id,
      data: { nome: editingProduct.nome, descricao: editingProduct.descricao, icon: editingProduct.icon },
    });
    setEditDialogOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id);
    if (activeProduct === deletingProduct.id) {
      const remaining = products.filter((p) => p.id !== deletingProduct.id);
      if (remaining.length > 0) onChangeProduct(remaining[0].id as ProductId);
    }
    setDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  const openEdit = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingProduct({ ...product });
    setEditDialogOpen(true);
    setProductOpen(false);
  };

  const openDelete = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
    setProductOpen(false);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <img src={logoHef} alt="HefSys" className="h-20 w-auto" />
        <p className="text-[10px] uppercase tracking-[1.5px] font-semibold text-primary mt-1.5">
          Plataforma Interna
        </p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
      {/* Product Selector */}
      <div className="px-3 pt-4 pb-2">
        {isAdmin && (
          <button
            onClick={() => onNavigate("general-dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-3 ${
              activePage === "general-dashboard"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-primary/5 text-foreground border border-primary/15 hover:bg-primary/10"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Globe size={16} className="text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold">Dashboard Geral</div>
              <div className="text-[10px] text-muted-foreground">Visão consolidada</div>
            </div>
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => onNavigate("cash-flow")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-3 ${
              activePage === "cash-flow"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-primary/5 text-foreground border border-primary/15 hover:bg-primary/10"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Wallet size={16} className="text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold">Fluxo de Caixa</div>
              <div className="text-[10px] text-muted-foreground">Receitas e despesas</div>
            </div>
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setProductOpen(!productOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/80 border border-border hover:bg-secondary transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0">
              <CurrentIcon size={16} className="text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold truncate">{currentProduct?.nome || "Produto"}</div>
              <div className="text-[10px] text-muted-foreground">{currentProduct?.descricao}</div>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${productOpen ? "rotate-180" : ""}`} />
          </button>

          {productOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
              {products.map((product) => {
                const Icon = getIcon(product.icon);
                const isActive = product.id === activeProduct;
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      onChangeProduct(product.id);
                      setProductOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group ${
                      isActive ? "bg-primary/12 text-primary" : "hover:bg-secondary/80 text-sidebar-foreground"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-primary/20" : "bg-secondary"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{product.nome}</div>
                      <div className="text-[10px] text-muted-foreground">{product.descricao}</div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <span
                          role="button"
                          onClick={(e) => openEdit(e, product)}
                          className="p-1 rounded hover:bg-secondary transition-colors"
                        >
                          <Pencil size={12} className="text-muted-foreground hover:text-foreground" />
                        </span>
                        <span
                          role="button"
                          onClick={(e) => openDelete(e, product)}
                          className="p-1 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={12} className="text-destructive/70 hover:text-destructive" />
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => { setProductOpen(false); setAddDialogOpen(true); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-primary hover:bg-primary/5 transition-colors border-t border-border"
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-primary/10">
                    <Plus size={14} />
                  </div>
                  <div className="text-sm font-semibold">Novo Produto</div>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="px-3 py-2 flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[1.5px] text-muted-foreground/60 font-semibold px-3 pb-2 pt-2">
          Menu
        </span>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? "bg-primary/12 text-primary border border-primary/15"
                  : "text-sidebar-foreground border border-transparent hover:bg-card hover:text-foreground"
                }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1">
        {isAdmin && (
          <button
            onClick={() => onNavigate("users")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
              activePage === "users"
                ? "bg-primary/12 text-primary border border-primary/15"
                : "text-sidebar-foreground border border-transparent hover:bg-card hover:text-foreground"
            }`}
          >
            <UserCog size={18} />
            Usuários
          </button>
        )}
        <button
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground border border-transparent hover:bg-card hover:text-foreground transition-all w-full"
        >
          <Settings size={18} />
          Configurações
        </button>

        <div className="border-t border-sidebar-border pt-3 mt-2">
          <div className="px-3 pb-2">
            <div className="text-xs font-semibold truncate">{profile?.display_name || profile?.username}</div>
            <div className="text-[10px] text-muted-foreground">@{profile?.username}</div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive/80 border border-transparent hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">Novo Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={newProduct.nome} onChange={(e) => setNewProduct((p) => ({ ...p, nome: e.target.value }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input value={newProduct.descricao} onChange={(e) => setNewProduct((p) => ({ ...p, descricao: e.target.value }))} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ícone</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                {AVAILABLE_ICONS.map((iconName) => {
                  const Ic = getIcon(iconName);
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setNewProduct((p) => ({ ...p, icon: iconName }))}
                      className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                        newProduct.icon === iconName ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary hover:bg-secondary/80 border border-border"
                      }`}
                      title={iconName}
                    >
                      <Ic size={14} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAddDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddProduct} disabled={!newProduct.nome} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                Criar Produto
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-heading">Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input value={editingProduct.nome} onChange={(e) => setEditingProduct((p) => p ? { ...p, nome: e.target.value } : p)} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <Input value={editingProduct.descricao} onChange={(e) => setEditingProduct((p) => p ? { ...p, descricao: e.target.value } : p)} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ícone</Label>
                <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const Ic = getIcon(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setEditingProduct((p) => p ? { ...p, icon: iconName } : p)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                          editingProduct.icon === iconName ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary hover:bg-secondary/80 border border-border"
                        }`}
                        title={iconName}
                      >
                        <Ic size={14} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button onClick={handleEditProduct} disabled={!editingProduct.nome} className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                  Salvar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingProduct?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
