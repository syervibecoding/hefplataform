import StatusTag from "@/components/StatusTag";
import { Melhoria } from "@/data/constants";

interface Props {
  melhorias: Melhoria[];
}

export default function MelhoriasPage({ melhorias }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-[15px] font-semibold">Melhorias & Roadmap</h2>
      </div>
      <div>
        {melhorias.map((m) => (
          <div key={m.id} className="flex items-center gap-3.5 px-5 py-4 border-b border-border/50 last:border-b-0 hover:bg-secondary/50 transition-colors">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                m.prioridade === "alta" ? "bg-clix-danger" : m.prioridade === "media" ? "bg-clix-warning" : "bg-clix-info"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{m.titulo}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">{m.tipo} · {m.prioridade}</div>
            </div>
            <StatusTag status={m.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
