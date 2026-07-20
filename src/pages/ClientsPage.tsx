import { ChevronRight, FileWarning } from "lucide-react";
import StatusTag from "@/components/StatusTag";
import AddClientDialog from "@/components/AddClientDialog";
import EditClientDialog from "@/components/EditClientDialog";
import DeleteClientDialog from "@/components/DeleteClientDialog";
import { type AnyClient, type ProductId, type GenericClient, isHefSysClient, FREQUENCIAS, TODAS_CONSULTAS } from "@/data/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useClientValueAdjustmentsForClients } from "@/hooks/useClientValueAdjustments";
import { getValorEfetivo, type ValueAdjustment } from "@/lib/getValorEfetivo";

interface Props {
  clients: AnyClient[];
  activeProduct: ProductId;
  onSelectClient: (client: AnyClient) => void;
  onAddClient: (data: any) => void;
  onEditClient: (id: string, data: any) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientsPage({ clients, activeProduct, onSelectClient, onAddClient, onEditClient, onDeleteClient }: Props) {
  const { isAdmin } = useAuth();
  const isHefsys = activeProduct === "hefsys";
  const isPlataformas = activeProduct === "plataformas";
  const supportsValueAdjustments = activeProduct === "hefsys" || activeProduct === "consultoria-clix";
  const { data: valueAdjustments = [] } = useClientValueAdjustmentsForClients(
    supportsValueAdjustments ? clients.map((client) => client.id) : [],
  );

  const unsignedClients = clients.filter(
    (c) => c.status === "ativo" && c.product_id !== "plataformas" && !(c as any).contratoAssinado,
  );

  const getCurrentValue = (client: AnyClient, baseValue: number) => {
    const now = new Date();
    const adjustments = valueAdjustments
      .filter((adjustment) => adjustment.client_id === client.id)
      .map<ValueAdjustment>((adjustment) => ({
        data_inicio: adjustment.data_inicio,
        novo_valor: adjustment.novo_valor,
      }));

    return getValorEfetivo(baseValue, adjustments, now.getFullYear(), now.getMonth());
  };

  const headers = isHefsys
    ? isAdmin
      ? ["Cliente", "CNPJs", "Consultas", "Frequência", "Faturamento", "Custo API", "Status", ""]
      : ["Cliente", "CNPJs", "Consultas", "Frequência", "Status", ""]
    : isPlataformas
      ? isAdmin
        ? ["Cliente", "Plataforma", "Tipo", "Status", "Implementação", "Mensal", ""]
        : ["Cliente", "Plataforma", "Tipo", "Status", ""]
      : isAdmin
        ? ["Cliente", "Contato", "WhatsApp", "Status", "Valor/Mês", ""]
        : ["Cliente", "Contato", "WhatsApp", "Status", ""];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {unsignedClients.length > 0 && (
        <div className="px-4 md:px-5 py-3 border-b border-border bg-hef-warning/10 flex items-start gap-3">
          <FileWarning size={18} className="text-hef-warning shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-hef-warning">
              {unsignedClients.length} contrato{unsignedClients.length > 1 ? "s" : ""} pendente{unsignedClients.length > 1 ? "s" : ""} de assinatura
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {unsignedClients.map((c) => c.nome).join(" · ")}
            </p>
          </div>
        </div>
      )}
      <div className="px-4 md:px-5 py-3 md:py-4 border-b border-border flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">Clientes</h2>
        <AddClientDialog activeProduct={activeProduct} onAddClient={onAddClient} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2.5 border-b border-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => onSelectClient(c)}>
                {isHefsys && isHefSysClient(c) ? (
                  <>
                    <td className="px-4 py-3.5 border-b border-border/50">
                      <div className="font-semibold text-sm">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.contato}</div>
                      {c.status === "ativo" && !(c as any).contratoAssinado && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-hef-warning/15 text-hef-warning">
                          <FileWarning size={10} /> Contrato pendente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">{c.cnpjs}</td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono text-sm">{c.consultas.length}</td>
                    <td className="px-4 py-3.5 border-b border-border/50">
                      <span className="text-[11px] bg-primary/12 text-primary px-2.5 py-0.5 rounded-md font-semibold">
                        {FREQUENCIAS.find((f) => f.id === c.frequencia)?.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <>
                        <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm text-hef-success">
                          R$ {getCurrentValue(c, c.faturamento || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm text-hef-warning">
                          R$ {(c.custoAPI || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3.5 border-b border-border/50"><StatusTag status={c.status} /></td>
                  </>
                ) : !isHefSysClient(c) ? (
                  <>
                    <td className="px-4 py-3.5 border-b border-border/50">
                      <div className="font-semibold text-sm">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                      {c.status === "ativo" && !(c as any).contratoAssinado && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-hef-warning/15 text-hef-warning">
                          <FileWarning size={10} /> Contrato pendente
                        </span>
                      )}
                    </td>
                    {isPlataformas ? (
                      <>
                        <td className="px-4 py-3.5 border-b border-border/50 text-sm">{(c as GenericClient).nomePlataforma || "—"}</td>
                        <td className="px-4 py-3.5 border-b border-border/50 text-sm capitalize">{(c as GenericClient).tipoPlataforma || "—"}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3.5 border-b border-border/50 text-sm">{c.contato}</td>
                        <td className="px-4 py-3.5 border-b border-border/50 text-sm font-mono">{c.whatsapp}</td>
                      </>
                    )}
                    <td className="px-4 py-3.5 border-b border-border/50"><StatusTag status={c.status} /></td>
                    {isAdmin && (
                      isPlataformas ? (
                        <>
                          <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm text-hef-info">
                            R$ {((c as GenericClient).valorImplementacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm text-hef-success">
                            {(c as GenericClient).temMensalidade ? `R$ ${((c as GenericClient).valorMensalidade || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">
                          R$ {getCurrentValue(c, (c as GenericClient).valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                      )
                    )}
                  </>
                ) : null}
                <td className="px-4 py-3.5 border-b border-border/50">
                  <div className="flex items-center gap-1">
                    <EditClientDialog client={c} activeProduct={activeProduct} onEditClient={onEditClient} />
                    <DeleteClientDialog clientName={c.nome} onDelete={() => onDeleteClient(c.id)} />
                    <ChevronRight size={16} className="text-muted-foreground ml-1" />
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum cliente cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
