import { ChevronRight, Globe, Wallet, Boxes } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getIcon } from "@/lib/icon-map";
import type { Product } from "@/hooks/useProducts";
import type { ProductId } from "@/data/constants";

interface HomePageProps {
  products: Product[];
  onNavigate: (page: string) => void;
  onChangeProduct: (id: ProductId) => void;
}

interface CardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  onClick: () => void;
  highlight?: boolean;
}

function HomeCard({ icon: Icon, title, subtitle, onClick, highlight }: CardProps) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-4 p-5 rounded-xl bg-card border transition-all hover:bg-card/80 hover:border-primary/40 text-left ${
        highlight ? "border-primary/30" : "border-border"
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0">
        <Icon size={22} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-bold text-base">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

export default function HomePage({ products, onNavigate, onChangeProduct }: HomePageProps) {
  const { isAdmin } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      <div className="mb-6">
        <h2 className="text-2xl font-heading font-bold tracking-tight">Bem-vindo</h2>
        <p className="text-sm text-muted-foreground mt-1">Escolha por onde começar.</p>
      </div>

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

      {products.map((product) => {
        const Icon = getIcon(product.icon);
        return (
          <HomeCard
            key={product.id}
            icon={Icon}
            title={product.nome}
            subtitle={product.descricao}
            onClick={() => {
              onChangeProduct(product.id as ProductId);
              onNavigate("dashboard");
            }}
          />
        );
      })}

      <HomeCard
        icon={Boxes}
        title="Operacional"
        subtitle="Consultoria e Consultas Fiscais"
        onClick={() => onNavigate("operacional")}
        highlight
      />
    </div>
  );
}