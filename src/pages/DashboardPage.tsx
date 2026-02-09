import StatCard from "@/components/StatCard";
import StatusTag from "@/components/StatusTag";
import { type AnyClient, type ProductId, type Melhoria, isHefSysClient, FREQUENCIAS } from "@/data/constants";
import { getNextScheduleDay } from "@/lib/schedule-utils";

interface Props {
  clients: AnyClient[];
  melhorias: Melhoria[];
  activeProduct: ProductId;
}

export default function DashboardPage({ clients, melhorias, activeProduct }: Props) {
  const isHefsys = activeProduct === "hefsys";
  const activeClients = clients.filter((c) => c.status === "ativo");
  const emDev = melhorias.filter((m) => m.status === "em_desenvolvimento").length;

  const hefsysMetrics = () => {
    const hefsysClients = clients.filter(isHefSysClient);
    const totalCnpjs = hefsysClients.reduce((s, c) => s + c.cnpjs, 0);
    const totalFaturamento = hefsysClients.filter((c) => c.status === "ativo").reduce((s, c) => s + (c.faturamento || 0), 0);
    const totalCustoAPI = hefsysClients.filter((c) => c.status === "ativo").reduce((s, c) => s + (c.custoAPI || 0), 0);
    return { totalCnpjs, totalFaturamento, totalCustoAPI };
  };

  const genericMetrics = () => {
    const genericClients = clients.filter((c) => !isHefSysClient(c)) as any[];
    const receita = genericClients.filter((c) => c.status === "ativo").reduce((s: number, c: any) => s + (c.valorContrato || 0), 0);
    return { receita };
  };

  const now = new Date();

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-7">
        <StatCard label="Clientes Ativos" value={activeClients.length} sub="neste produto" colorClass="text-primary" />
        {isHefsys ? (
          <>
            <StatCard label="CNPJs Monitorados" value={hefsysMetrics().totalCnpjs} sub="total de empresas" colorClass="text-clix-info" />
            <StatCard label="Faturamento/Mês" value={`R$ ${hefsysMetrics().totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub="contratos ativos" colorClass="text-clix-success" />
            <StatCard label="Custo API/Mês" value={`R$ ${hefsysMetrics().totalCustoAPI.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub={`${emDev} melhorias em dev`} colorClass="text-clix-warning" />
          </>
        ) : (
          <>
            <StatCard label="Receita Mensal" value={`R$ ${genericMetrics().receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} sub="contratos ativos" colorClass="text-clix-info" />
            <StatCard label="Total Clientes" value={clients.length} sub="cadastrados" colorClass="text-clix-magenta" />
            <StatCard label="Em Desenvolvimento" value={emDev} sub="melhorias ativas" colorClass="text-clix-warning" />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">{isHefsys ? "Próximas Execuções" : "Clientes Recentes"}</h2>
            <span className="text-[11px] bg-primary/12 text-primary px-2.5 py-0.5 rounded-md font-semibold">
              {isHefsys ? "Esta Semana" : `${activeClients.length} ativos`}
            </span>
          </div>
          <div>
            {isHefsys
              ? clients.filter(isHefSysClient).map((c) => {
                  const nextCert = getNextScheduleDay(c.agendaCertidoes || {}, now.getFullYear(), now.getMonth());
                  const nextCaixa = getNextScheduleDay(c.agendaCaixasPostais || {}, now.getFullYear(), now.getMonth());
                  const nextDay = [nextCert, nextCaixa].filter((d): d is number => d !== null).sort((a, b) => a - b)[0];
                  return (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
                      <div>
                        <div className="font-semibold text-sm">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{c.cnpjs} CNPJs · {c.consultas.length} consultas</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold font-mono">{nextDay ? `Dia ${nextDay}` : "—"}</div>
                        <div className="text-[11px] text-muted-foreground">{FREQUENCIAS.find((f) => f.id === c.frequencia)?.label}</div>
                      </div>
                    </div>
                  );
                })
              : clients.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-border last:border-b-0">
                    <div>
                      <div className="font-semibold text-sm">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.contato}</div>
                    </div>
                    <StatusTag status={c.status} />
                  </div>
                ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Melhorias & Desenvolvimento</h2>
            <span className="text-[11px] bg-clix-info/12 text-clix-info px-2.5 py-0.5 rounded-md font-semibold">{emDev} ativas</span>
          </div>
          <div>
            {melhorias.filter((m) => m.status !== "concluido").slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border/50 last:border-b-0 hover:bg-secondary/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  m.prioridade === "alta" ? "bg-clix-danger" : m.prioridade === "media" ? "bg-clix-warning" : "bg-clix-info"
                }`} />
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
