import StatCard from "@/components/StatCard";
import StatusTag from "@/components/StatusTag";
import { Client, Melhoria, FREQUENCIAS, TODAS_CONSULTAS } from "@/data/constants";

interface Props {
  clients: Client[];
  melhorias: Melhoria[];
}

export default function DashboardPage({ clients, melhorias }: Props) {
  const totalCnpjs = clients.reduce((s, c) => s + c.cnpjs, 0);
  const totalConsultas = clients.reduce((s, c) => {
    const freq = FREQUENCIAS.find((f) => f.id === c.frequencia);
    return s + c.cnpjs * c.consultas.length * (freq?.vezes || 1);
  }, 0);
  const custoEstimado = clients.reduce((s, c) => {
    const freq = FREQUENCIAS.find((f) => f.id === c.frequencia);
    return (
      s +
      c.consultas.reduce((cs, cid) => {
        const q = TODAS_CONSULTAS.find((x) => x.id === cid);
        return cs + (q?.custo || 0) * c.cnpjs * (freq?.vezes || 1);
      }, 0)
    );
  }, 0);
  const emDev = melhorias.filter((m) => m.status === "em_desenvolvimento").length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="Clientes Ativos" value={clients.length} sub="escritórios contábeis" colorClass="text-primary" />
        <StatCard label="CNPJs Monitorados" value={totalCnpjs} sub="total de empresas" colorClass="text-clix-info" />
        <StatCard label="Consultas/Mês" value={totalConsultas.toLocaleString("pt-BR")} sub="execuções estimadas" colorClass="text-clix-magenta" />
        <StatCard label="Custo API/Mês" value={`R$ ${custoEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub={`${emDev} melhorias em dev`} colorClass="text-clix-warning" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Próximas Execuções */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Próximas Execuções</h2>
            <span className="text-[11px] bg-primary/12 text-primary px-2.5 py-0.5 rounded-md font-semibold">Esta Semana</span>
          </div>
          <div>
            {clients.map((c) => {
              const nextDay = c.diasExecucao.find((d) => d >= new Date().getDate()) || c.diasExecucao[0];
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
                  <div>
                    <div className="font-semibold text-sm">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{c.cnpjs} CNPJs · {c.consultas.length} consultas</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold font-mono">Dia {nextDay}</div>
                    <div className="text-[11px] text-muted-foreground">{FREQUENCIAS.find((f) => f.id === c.frequencia)?.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Melhorias */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Melhorias & Desenvolvimento</h2>
            <span className="text-[11px] bg-clix-info/12 text-clix-info px-2.5 py-0.5 rounded-md font-semibold">{emDev} ativas</span>
          </div>
          <div>
            {melhorias.filter((m) => m.status !== "concluido").slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border/50 last:border-b-0 hover:bg-secondary/50 transition-colors">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    m.prioridade === "alta" ? "bg-clix-danger" : m.prioridade === "media" ? "bg-clix-warning" : "bg-clix-info"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold truncate">{m.titulo}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{m.tipo}</div>
                </div>
                <StatusTag status={m.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
