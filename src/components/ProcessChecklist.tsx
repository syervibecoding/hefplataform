import { Checkbox } from "@/components/ui/checkbox";
import { useClientChecklist, type ChecklistTipo } from "@/hooks/useClientChecklist";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

const CERTIDOES_STEPS = [
  { id: "verificar_bases", label: "Verificar as bases que estamos rodando no código / usar o código correto" },
  { id: "rodar_api", label: "Rodar a API / automação" },
  { id: "verificar_emissao", label: "Verificar quanto foi emitido no mês anterior e se tiver menos, verificar o porquê" },
  { id: "relatorio_excel", label: "Fazer o relatório em Excel do que foi emitido e não foi emitido" },
  { id: "subir_arquivos", label: "Subir os arquivos para pasta" },
  { id: "check_arquivos", label: "Verificar se todos os arquivos subiram corretamente ou esquecemos de subir/fazer" },
];

const CAIXAS_POSTAIS_STEPS = [
  { id: "verificar_bases", label: "Verificar as bases que estamos rodando no código / usar o código correto" },
  { id: "rodar_api", label: "Rodar a API / automação" },
  { id: "verificar_mensagens", label: "Verificar se houve mensagens importantes" },
  { id: "enviar_cliente", label: "Se houver, enviar para o WhatsApp do cliente e email" },
];

interface Props {
  clientId: string;
  tipo: ChecklistTipo;
}

export default function ProcessChecklist({ clientId, tipo }: Props) {
  const { checklist, isLoading, toggleStep } = useClientChecklist(clientId, tipo);
  const steps = tipo === "certidoes" ? CERTIDOES_STEPS : CAIXAS_POSTAIS_STEPS;
  const stepsState = checklist?.steps || {};
  const doneCount = steps.filter((s) => stepsState[s.id]).length;
  const allDone = doneCount === steps.length;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-3">
        <Loader2 size={14} className="animate-spin" /> Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          {tipo === "certidoes" ? "Checklist Certidões" : "Checklist Caixas Postais"}
        </span>
        <span className={`text-[11px] font-semibold flex items-center gap-1 ${allDone ? "text-clix-success" : "text-muted-foreground"}`}>
          {allDone ? <CheckCircle2 size={12} /> : <Circle size={12} />}
          {doneCount}/{steps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-clix-success transition-all duration-300 rounded-full"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-0.5">
        {steps.map((step, i) => {
          const done = !!stepsState[step.id];
          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                done ? "bg-clix-success/5" : "hover:bg-muted/50"
              }`}
              onClick={() => toggleStep(step.id)}
            >
              <Checkbox checked={done} className="mt-0.5 shrink-0" tabIndex={-1} />
              <span className={`text-sm leading-snug ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                <span className="text-muted-foreground font-mono text-[11px] mr-1.5">{i + 1}.</span>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
