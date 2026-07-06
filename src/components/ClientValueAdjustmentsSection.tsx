import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientValueAdjustments } from "@/hooks/useClientValueAdjustments";
import { freezeClientHistory } from "@/lib/freezeClientHistory";

interface Props {
  clientId: string;
  label?: string;
}

export default function ClientValueAdjustmentsSection({ clientId, label = "Reajustes de valor" }: Props) {
  const { data: adjustments = [], addAdjustment, deleteAdjustment } = useClientValueAdjustments(clientId);
  const [dataInicio, setDataInicio] = useState("");
  const [novoValor, setNovoValor] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const valor = Number(novoValor);
    if (!dataInicio || !Number.isFinite(valor) || valor < 0) return;
    setSaving(true);
    try {
      // Garante que meses anteriores fiquem congelados com o valor atual antes do reajuste passar a valer.
      await freezeClientHistory(clientId).catch(() => {});
      await addAdjustment.mutateAsync({ data_inicio: dataInicio, novo_valor: valor });
      setDataInicio("");
      setNovoValor("");
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...adjustments].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));

  return (
    <div className="space-y-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Meses já lançados no fluxo permanecem congelados. Reajustes valem a partir da data escolhida em diante.
        </p>
      </div>

      {sorted.length > 0 && (
        <div className="space-y-1.5">
          {sorted.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-secondary/60 rounded-md px-2 py-1.5">
              <span className="text-xs text-muted-foreground">a partir de</span>
              <span className="text-xs font-mono">{a.data_inicio.split("-").reverse().join("/")}</span>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-xs font-mono font-semibold">
                {a.novo_valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              <button
                type="button"
                onClick={() => deleteAdjustment.mutate(a.id)}
                className="ml-auto p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Remover"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <Label className="text-[10px] text-muted-foreground">A partir de</Label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="mt-1 h-9 bg-secondary border-border"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Novo valor (R$)</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={novoValor}
            onChange={(e) => setNovoValor(e.target.value)}
            className="mt-1 h-9 bg-secondary border-border"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !dataInicio || !novoValor}
          className="h-9 px-3 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-1"
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>
    </div>
  );
}