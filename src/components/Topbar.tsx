import { Menu } from "lucide-react";

interface TopbarProps {
  title: string;
  tag?: string;
  onOpenMenu?: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  home: "Início",
  operacional: "Operacional",
  consultoria: "Consultoria",
  "consultoria-relatorio": "Relatório de Consultoria",
  dashboard: "Dashboard",
  clients: "Clientes",
  calendar: "Calendário",
  workflow: "Workflow",
  melhorias: "Melhorias",
  support: "Gerenciador de Plataformas",
  assistant: "Assistente Financeiro",
  settings: "Configurações",
};

export default function Topbar({ title, tag, onOpenMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 px-4 md:px-8 py-3 md:py-4 bg-background/85 backdrop-blur-xl border-b border-border flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="md:hidden p-2 -ml-2 rounded-md text-foreground hover:bg-secondary transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-base md:text-xl font-bold tracking-tight truncate">{PAGE_TITLES[title] || title}</h1>
      </div>
      {tag && (
        <span className="text-[10px] md:text-xs bg-primary/12 text-primary px-2 md:px-3 py-1 rounded-md font-semibold border border-primary/15 whitespace-nowrap">
          {tag}
        </span>
      )}
    </header>
  );
}
