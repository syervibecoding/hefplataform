const COLOR_MAP: Record<string, string> = {
  concluido: "bg-clix-success/12 text-clix-success",
  ativo: "bg-clix-success/12 text-clix-success",
  em_andamento: "bg-clix-info/12 text-clix-info",
  em_desenvolvimento: "bg-clix-info/12 text-clix-info",
  pendente: "bg-clix-warning/12 text-clix-warning",
  erro: "bg-clix-danger/12 text-clix-danger",
  nao_executado: "bg-muted-foreground/12 text-muted-foreground",
  backlog: "bg-muted-foreground/12 text-muted-foreground",
};

const LABEL_MAP: Record<string, string> = {
  concluido: "Concluído",
  ativo: "Ativo",
  em_andamento: "Em Andamento",
  em_desenvolvimento: "Em Dev",
  pendente: "Pendente",
  erro: "Erro",
  nao_executado: "Não Executado",
  backlog: "Backlog",
};

export default function StatusTag({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${COLOR_MAP[status] || "bg-muted text-muted-foreground"}`}>
      {LABEL_MAP[status] || status}
    </span>
  );
}
