import { ChevronRight } from "lucide-react";
import StatusTag from "@/components/StatusTag";
import AddClientDialog from "@/components/AddClientDialog";
import { type AnyClient, type ProductId, isHefSysClient, FREQUENCIAS, TODAS_CONSULTAS } from "@/data/constants";

interface Props {
  clients: AnyClient[];
  activeProduct: ProductId;
  onSelectClient: (client: AnyClient) => void;
  onAddClient: (data: any) => void;
}

export default function ClientsPage({ clients, activeProduct, onSelectClient, onAddClient }: Props) {
  const isHefsys = activeProduct === "hefsys";

  const headers = isHefsys
    ? ["Cliente", "CNPJs", "Consultas", "Frequência", "Dias", "Status", "Custo/Mês", ""]
    : ["Cliente", "Contato", "WhatsApp", "Status", "Valor/Mês", ""];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Clientes</h2>
        <AddClientDialog activeProduct={activeProduct} onAddClient={onAddClient} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
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
                    </td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">{c.cnpjs}</td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono text-sm">{c.consultas.length}</td>
                    <td className="px-4 py-3.5 border-b border-border/50">
                      <span className="text-[11px] bg-primary/12 text-primary px-2.5 py-0.5 rounded-md font-semibold">
                        {FREQUENCIAS.find((f) => f.id === c.frequencia)?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono text-[13px]">{c.diasExecucao.join(", ")}</td>
                    <td className="px-4 py-3.5 border-b border-border/50"><StatusTag status={c.status} /></td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">
                      R$ {c.consultas.reduce((s, cid) => {
                        const q = TODAS_CONSULTAS.find((x) => x.id === cid);
                        const freq = FREQUENCIAS.find((f) => f.id === c.frequencia);
                        return s + (q?.custo || 0) * c.cnpjs * (freq?.vezes || 1);
                      }, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </>
                ) : !isHefSysClient(c) ? (
                  <>
                    <td className="px-4 py-3.5 border-b border-border/50">
                      <div className="font-semibold text-sm">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5 border-b border-border/50 text-sm">{c.contato}</td>
                    <td className="px-4 py-3.5 border-b border-border/50 text-sm font-mono">{c.whatsapp}</td>
                    <td className="px-4 py-3.5 border-b border-border/50"><StatusTag status={c.status} /></td>
                    <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">
                      R$ {c.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </>
                ) : null}
                <td className="px-4 py-3.5 border-b border-border/50 text-muted-foreground"><ChevronRight size={16} /></td>
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
