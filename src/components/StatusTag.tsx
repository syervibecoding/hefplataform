const COLOR_MAP: Record<string, string> = {
  concluido: "bg-hef-success/12 text-hef-success",
  ativo: "bg-hef-success/12 text-hef-success",
  em_andamento: "bg-hef-info/12 text-hef-info",
  em_desenvolvimento: "bg-hef-info/12 text-hef-info",
  pendente: "bg-hef-warning/12 text-hef-warning",
  erro: "bg-hef-danger/12 text-hef-danger",
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
