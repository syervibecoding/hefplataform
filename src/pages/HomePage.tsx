import { ChevronRight, Globe, Wallet, Boxes, Activity, LayoutGrid, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadTotal } from "@/hooks/useUnreadSupport";
import type { Product } from "@/hooks/useProducts";
import type { ProductId } from "@/data/constants";

interface HomePageProps {
  products: Product[];
  onNavigate: (page: string) => void;
  onChangeProduct: (id: ProductId) => void;
}

interface CardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
  badge?: number;
}

function HomeCard({ icon: Icon, title, subtitle, onClick, badge }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex flex-col gap-3 p-5 rounded-xl bg-card border border-border transition-all hover:bg-card/80 hover:border-primary/40 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="relative w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
          {badge && badge > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-card">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </div>
        <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <div>
        <div className="font-heading font-bold text-base">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { isAdmin } = useAuth();
  const unread = useUnreadTotal();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold tracking-tight">Bem-vindo</h2>
        <p className="text-sm text-muted-foreground mt-1">Escolha por onde começar.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isAdmin && (
          <HomeCard
            icon={Globe}
            title="Dashboard Geral"
            subtitle="Visão consolidada"
            onClick={() => onNavigate("general-dashboard")}
          />
        )}
        {isAdmin && (
          <HomeCard
            icon={Wallet}
            title="Fluxo de Caixa"
            subtitle="Receitas e despesas"
            onClick={() => onNavigate("cash-flow")}
          />
        )}
        <HomeCard
          icon={Boxes}
          title="Operacional"
          subtitle="Consultoria e consultas"
          onClick={() => onNavigate("operacional")}
        />
        <HomeCard
          icon={Activity}
          title="Planning"
          subtitle="Fluxos e tarefas"
          onClick={() => onNavigate("workflow")}
        />
        <HomeCard
          icon={LayoutGrid}
          title="Gerenciador de Plataformas"
          subtitle="Plataformas, chamados e acessos"
          onClick={() => onNavigate("support")}
          badge={unread}
        />
      </div>
    </div>
  );
}