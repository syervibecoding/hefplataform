import { ArrowLeft, ChevronRight, Briefcase, FileText } from "lucide-react";
import type { ProductId } from "@/data/constants";

interface OperacionalPageProps {
  onNavigate: (page: string) => void;
  onChangeProduct: (id: ProductId) => void;
}

interface CardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  tag: string;
  description: string;
  onClick: () => void;
}

function OpCard({ icon: Icon, title, tag, description, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-all text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/12 flex items-center justify-center flex-shrink-0">
        <Icon size={22} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-bold text-base">{title}</span>
          <span className="text-[10px] uppercase tracking-wide bg-primary/12 text-primary px-2 py-0.5 rounded-md font-semibold">
            {tag}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
    </button>
  );
}

export default function OperacionalPage({ onNavigate, onChangeProduct }: OperacionalPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        onClick={() => onNavigate("home")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para Início
      </button>

      <div className="mb-2">
        <h2 className="text-2xl font-heading font-bold tracking-tight">Operacional</h2>
        <p className="text-sm text-muted-foreground mt-1">Áreas operacionais do dia a dia.</p>
      </div>

      <OpCard
        icon={Briefcase}
        title="Consultoria"
        tag="Transformação digital • IA"
        description="Acompanhamento das melhorias contínuas e geração de relatórios de consultoria por cliente."
        onClick={() => onNavigate("consultoria")}
      />

      <OpCard
        icon={FileText}
        title="Consultas Fiscais"
        tag="Certidões e caixas postais"
        description="Acompanhamento de certidões negativas, situação fiscal no eCAC e demais consultas obrigatórias dos clientes."
        onClick={() => {
          onChangeProduct("hefsys" as ProductId);
          onNavigate("dashboard");
        }}
      />
    </div>
  );
}