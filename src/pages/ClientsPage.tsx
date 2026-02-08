import { ChevronRight, Plus } from "lucide-react";
import StatusTag from "@/components/StatusTag";
import { Client, FREQUENCIAS, TODAS_CONSULTAS } from "@/data/constants";

interface Props {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export default function ClientsPage({ clients, onSelectClient }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Clientes Clix</h2>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
          <Plus size={14} />
          Novo Cliente
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {["Cliente", "CNPJs", "Consultas", "Frequência", "Dias", "Status", "Custo/Mês", ""].map((h) => (
                <th key={h} className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-4 py-2.5 border-b border-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const freq = FREQUENCIAS.find((f) => f.id === c.frequencia);
              const custo = c.consultas.reduce((s, cid) => {
                const q = TODAS_CONSULTAS.find((x) => x.id === cid);
                return s + (q?.custo || 0) * c.cnpjs * (freq?.vezes || 1);
              }, 0);
              return (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => onSelectClient(c)}
                >
                  <td className="px-4 py-3.5 border-b border-border/50">
                    <div className="font-semibold text-sm">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{c.contato}</div>
                  </td>
                  <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">{c.cnpjs}</td>
                  <td className="px-4 py-3.5 border-b border-border/50 font-mono text-sm">{c.consultas.length}</td>
                  <td className="px-4 py-3.5 border-b border-border/50">
                    <span className="text-[11px] bg-primary/12 text-primary px-2.5 py-0.5 rounded-md font-semibold">{freq?.label}</span>
                  </td>
                  <td className="px-4 py-3.5 border-b border-border/50 font-mono text-[13px]">{c.diasExecucao.join(", ")}</td>
                  <td className="px-4 py-3.5 border-b border-border/50"><StatusTag status={c.status} /></td>
                  <td className="px-4 py-3.5 border-b border-border/50 font-mono font-semibold text-sm">
                    R$ {custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 border-b border-border/50 text-muted-foreground"><ChevronRight size={16} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
