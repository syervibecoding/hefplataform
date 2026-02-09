import { ArrowLeft } from "lucide-react";
import StatusTag from "@/components/StatusTag";
import EditClientDialog from "@/components/EditClientDialog";
import DeleteClientDialog from "@/components/DeleteClientDialog";
import { type AnyClient, type ProductId, isHefSysClient, TODAS_CONSULTAS, FREQUENCIAS } from "@/data/constants";
import { scheduleLabel } from "@/lib/schedule-utils";

interface Props {
  client: AnyClient;
  activeProduct: ProductId;
  onBack: () => void;
  onEditClient: (id: string, data: any) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientDetailPage({ client, activeProduct, onBack, onEditClient, onDeleteClient }: Props) {
  const isHefsys = isHefSysClient(client);

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
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">CNPJs</label>
                      <div className="text-lg font-bold font-mono mt-1">{client.cnpjs}</div>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Frequência</label>
                      <div className="text-lg font-bold mt-1">{freq?.label}</div>
                    </div>
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
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Valor do Contrato</label>
                <div className="text-lg font-bold font-mono mt-1 text-primary">
                  R$ {(client as any).valorContrato?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Status</label>
                <div className="mt-1"><StatusTag status={client.status} /></div>
              </div>
            </div>
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
