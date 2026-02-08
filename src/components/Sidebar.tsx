import { LayoutDashboard, Users, Calendar, Activity, Rocket, Settings } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "calendar", label: "Calendário", icon: Calendar },
  { id: "workflow", label: "Workflow", icon: Activity },
  { id: "melhorias", label: "Melhorias", icon: Rocket },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="px-5 py-6 border-b border-sidebar-border">
        <img src={logoWhite} alt="Clix Company" className="h-7 w-auto" />
        <p className="text-[10px] uppercase tracking-[1.5px] font-semibold text-primary mt-1.5">
          Plataforma Interna
        </p>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
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

      <div className="px-3 pb-4">
        <button
          onClick={() => onNavigate("settings")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground border border-transparent hover:bg-card hover:text-foreground transition-all w-full"
        >
          <Settings size={18} />
          Configurações
        </button>
      </div>
    </aside>
  );
}
