import { LayoutDashboard, Users, Calendar, Activity, Rocket, Settings, ChevronDown, LogOut, UserCog } from "lucide-react";
import { useState } from "react";
import logoWhite from "@/assets/logo-white.png";
import { PRODUCTS, type ProductId } from "@/data/constants";
import { useAuth } from "@/contexts/AuthContext";

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
  { id: "workflow", label: "Workflow", icon: Activity },
  { id: "melhorias", label: "Melhorias", icon: Rocket },
];

export default function Sidebar({ activePage, onNavigate, activeProduct, onChangeProduct }: SidebarProps) {
  const { profile, isAdmin, signOut } = useAuth();
  const [productOpen, setProductOpen] = useState(false);
  const currentProduct = PRODUCTS.find((p) => p.id === activeProduct)!;
  const ProductIcon = currentProduct.icon;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <img src={logoWhite} alt="Clix Company" className="h-7 w-auto" />
        <p className="text-[10px] uppercase tracking-[1.5px] font-semibold text-primary mt-1.5">
          Plataforma Interna
        </p>
      </div>

      {/* Product Selector */}
      <div className="px-3 pt-4 pb-2">
        <div className="relative">
          <button
            onClick={() => setProductOpen(!productOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/80 border border-border hover:bg-secondary transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center flex-shrink-0">
              <ProductIcon size={16} className="text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold truncate">{currentProduct.nome}</div>
              <div className="text-[10px] text-muted-foreground">{currentProduct.descricao}</div>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${productOpen ? "rotate-180" : ""}`} />
          </button>

          {productOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
              {PRODUCTS.map((product) => {
                const Icon = product.icon;
                const isActive = product.id === activeProduct;
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      onChangeProduct(product.id);
                      setProductOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isActive ? "bg-primary/12 text-primary" : "hover:bg-secondary/80 text-sidebar-foreground"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-primary/20" : "bg-secondary"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{product.nome}</div>
                      <div className="text-[10px] text-muted-foreground">{product.descricao}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5">
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
    </aside>
  );
}
