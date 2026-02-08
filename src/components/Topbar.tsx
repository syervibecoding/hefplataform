interface TopbarProps {
  title: string;
  tag?: string;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Clientes",
  calendar: "Calendário",
  workflow: "Workflow",
  melhorias: "Melhorias",
  settings: "Configurações",
};

export default function Topbar({ title, tag }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 px-8 py-4 bg-background/85 backdrop-blur-xl border-b border-border flex items-center justify-between">
      <h1 className="text-xl font-bold tracking-tight">{PAGE_TITLES[title] || title}</h1>
      {tag && (
        <span className="text-xs bg-primary/12 text-primary px-3 py-1 rounded-md font-semibold border border-primary/15">
          {tag}
        </span>
      )}
    </header>
  );
}
