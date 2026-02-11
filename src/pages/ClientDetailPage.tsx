import { ArrowLeft } from "lucide-react";
import StatusTag from "@/components/StatusTag";
import EditClientDialog from "@/components/EditClientDialog";
import DeleteClientDialog from "@/components/DeleteClientDialog";
import ProcessChecklist from "@/components/ProcessChecklist";
import { type AnyClient, type ProductId, type GenericClient, isHefSysClient, TODAS_CONSULTAS, FREQUENCIAS, CONSULTAS_CERTIDOES, CONSULTAS_CAIXAS } from "@/data/constants";
import { scheduleLabel } from "@/lib/schedule-utils";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  client: AnyClient;
  activeProduct: ProductId;
  onBack: () => void;
  onEditClient: (id: string, data: any) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientDetailPage({ client, activeProduct, onBack, onEditClient, onDeleteClient }: Props) {
  const { isAdmin } = useAuth();
  const isHefsys = isHefSysClient(client);
  const isTrafego = activeProduct === "trafego";

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{client.nome}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{client.contato} · {client.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusTag status={client.status} />
            <EditClientDialog client={client} activeProduct={activeProduct} onEditClient={onEditClient} />
            <DeleteClientDialog
              clientName={client.nome}
              onDelete={() => {
                onDeleteClient(client.id);
                onBack();
              }}
            />
          </div>
        </div>

        <div className="p-6">
          {isHefsys ? (
            <>
              {(() => {
                const freq = FREQUENCIAS.find((f) => f.id === client.frequencia);
                return (
                  <div className={`grid ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} gap-4 mb-6`}>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">CNPJs</label>
                      <div className="text-lg font-bold font-mono mt-1">{client.cnpjs}</div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Frequência</label>
                      <div className="text-lg font-bold mt-1">{freq?.label}</div>
                    </div>
                    {isAdmin && (
                      <>
                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Faturamento/Mês</label>
                          <div className="text-lg font-bold font-mono mt-1 text-clix-success">
                            R$ {(client.faturamento || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Custo API/Mês</label>
                          <div className="text-lg font-bold font-mono mt-1 text-clix-warning">
                            R$ {(client.custoAPI || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Consultas Ativas</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {client.consultas.map((cid) => {
                    const q = TODAS_CONSULTAS.find((x) => x.id === cid);
                    if (!q) return null;
                    return (
                      <span key={cid} className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        q.tipo === "certidao" ? "bg-clix-info/10 text-clix-info" : "bg-clix-magenta/10 text-clix-magenta"
                      }`}>
                        {q.nome}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Agenda das Certidões</label>
                  <div className="text-sm font-medium mt-1 text-clix-info">
                    {scheduleLabel(client.agendaCertidoes || {})}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Agenda das Caixas Postais</label>
                  <div className="text-sm font-medium mt-1 text-clix-magenta">
                    {scheduleLabel(client.agendaCaixasPostais || {})}
                  </div>
                </div>
              </div>

              {/* Checklists de Processo */}
              {(() => {
                const hasCertidoes = client.consultas.some((c) => CONSULTAS_CERTIDOES.some((x) => x.id === c));
                const hasCaixas = client.consultas.some((c) => CONSULTAS_CAIXAS.some((x) => x.id === c));
                if (!hasCertidoes && !hasCaixas) return null;
                return (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hasCertidoes && (
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <ProcessChecklist clientId={client.id} tipo="certidoes" schedule={client.agendaCertidoes || {}} />
                      </div>
                    )}
                    {hasCaixas && (
                      <div className="bg-muted/30 border border-border rounded-lg p-4">
                        <ProcessChecklist clientId={client.id} tipo="caixas_postais" schedule={client.agendaCaixasPostais || {}} />
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              <div className={`grid ${isTrafego ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-6`}>
                {isAdmin && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Valor do Contrato</label>
                    <div className="text-lg font-bold font-mono mt-1 text-primary">
                      R$ {((client as GenericClient).valorContrato || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Status</label>
                  <div className="mt-1"><StatusTag status={client.status} /></div>
                </div>
                {isTrafego && (client as GenericClient).formaPagamento && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Forma de Pagamento</label>
                    <div className="text-sm font-bold mt-1 capitalize">{(client as GenericClient).formaPagamento}</div>
                  </div>
                )}
              </div>

              {isTrafego && (() => {
                const gc = client as GenericClient;
                const hasRotina = gc.rotinaConferencia && Object.keys(gc.rotinaConferencia).length > 0;
                const isPix = gc.formaPagamento === "pix";

                return (
                  <div className="space-y-4">
                    {hasRotina && (
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Rotina de Conferência</label>
                        <div className="text-sm font-medium mt-1 text-clix-warning">
                          {scheduleLabel(gc.rotinaConferencia!)}
                        </div>
                      </div>
                    )}

                    {isPix && (
                      <div className="p-4 bg-clix-warning/5 border border-clix-warning/20 rounded-lg space-y-3">
                        <p className="text-[10px] uppercase tracking-wider text-clix-warning font-semibold">Controle de Saldo PIX</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[11px] text-muted-foreground">Saldo Depositado</label>
                            <div className="text-sm font-bold font-mono mt-0.5">
                              R$ {(gc.saldoAnuncio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground">Gasto Diário Médio</label>
                            <div className="text-sm font-bold font-mono mt-0.5">
                              R$ {(gc.gastoDiarioMedio || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] text-muted-foreground">Data do Depósito</label>
                            <div className="text-sm font-bold mt-0.5">
                              {gc.dataDeposito ? new Date(gc.dataDeposito + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                            </div>
                          </div>
                        </div>
                        {gc.saldoAnuncio && gc.gastoDiarioMedio && gc.dataDeposito && (() => {
                          const diasRestantes = Math.floor(gc.saldoAnuncio / gc.gastoDiarioMedio);
                          const depositDate = new Date(gc.dataDeposito + "T00:00:00");
                          const endDate = new Date(depositDate);
                          endDate.setDate(endDate.getDate() + diasRestantes);
                          const todayDate = new Date();
                          const daysUntilEnd = Math.ceil((endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
                          const isUrgent = daysUntilEnd <= 3;

                          return (
                            <div className={`flex items-center gap-2 p-2 rounded-lg text-sm font-medium ${
                              isUrgent ? "bg-destructive/10 text-destructive" : "bg-clix-info/10 text-clix-info"
                            }`}>
                              {isUrgent ? "⚠️" : "📅"}
                              Saldo esgota em {endDate.toLocaleDateString("pt-BR")} ({daysUntilEnd > 0 ? `${daysUntilEnd} dias` : "esgotado"})
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">WhatsApp</label>
              <div className="text-sm font-medium mt-1">{client.whatsapp}</div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Email</label>
              <div className="text-sm font-medium mt-1">{client.email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
