import { ChevronRight, Globe, Wallet, Boxes, Activity, LifeBuoy, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
}

function HomeCard({ icon: Icon, title, subtitle, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex flex-col gap-3 p-5 rounded-xl bg-card border border-border transition-all hover:bg-card/80 hover:border-primary/40 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
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
          icon={LifeBuoy}
          title="Suporte"
          subtitle="Chamados e métricas"
          onClick={() => onNavigate("support")}
        />
      </div>
    </div>
  );
}