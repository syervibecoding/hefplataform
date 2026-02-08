import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ProductId, type AnyClient, isHefSysClient, CONSULTAS_CERTIDOES, CONSULTAS_CAIXAS, FREQUENCIAS } from "@/data/constants";

const baseSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  contato: z.string().trim().min(1, "Contato é obrigatório").max(100),
  whatsapp: z.string().trim().min(1, "WhatsApp é obrigatório").max(20),
  email: z.string().trim().email("Email inválido").max(255),
  status: z.enum(["ativo", "inativo"]),
});

const hefsysSchema = baseSchema.extend({
  cnpjs: z.coerce.number().min(1, "Mínimo 1 CNPJ"),
  consultas: z.array(z.string()).min(1, "Selecione ao menos 1 consulta"),
  frequencia: z.string().min(1, "Selecione a frequência"),
  diasExecucao: z.string().min(1, "Informe os dias"),
  faturamento: z.coerce.number().min(0, "Valor inválido"),
  custoAPI: z.coerce.number().min(0, "Valor inválido"),
});

const genericSchema = baseSchema.extend({
  valorContrato: z.coerce.number().min(0, "Valor inválido"),
});

interface Props {
  client: AnyClient;
  activeProduct: ProductId;
  onEditClient: (id: string, data: any) => void;
}

export default function EditClientDialog({ client, activeProduct, onEditClient }: Props) {
  const [open, setOpen] = useState(false);
  const isHefsys = activeProduct === "hefsys";

  const hefsysForm = useForm<z.infer<typeof hefsysSchema>>({
    resolver: zodResolver(hefsysSchema),
  });

  const genericForm = useForm<z.infer<typeof genericSchema>>({
    resolver: zodResolver(genericSchema),
  });

  const form = isHefsys ? hefsysForm : genericForm;
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form as any;

  useEffect(() => {
    if (open) {
      if (isHefsys && isHefSysClient(client)) {
        hefsysForm.reset({
          nome: client.nome,
          contato: client.contato,
          whatsapp: client.whatsapp,
          email: client.email,
          status: client.status,
          cnpjs: client.cnpjs,
          consultas: client.consultas,
          frequencia: client.frequencia,
          diasExecucao: client.diasExecucao.join(", "),
          faturamento: client.faturamento || 0,
          custoAPI: client.custoAPI || 0,
        });
      } else if (!isHefSysClient(client)) {
        genericForm.reset({
          nome: client.nome,
          contato: client.contato,
          whatsapp: client.whatsapp,
          email: client.email,
          status: client.status,
          valorContrato: client.valorContrato,
        });
      }
    }
  }, [open]);

  const onSubmit = (data: any) => {
    if (isHefsys) {
      const dias = data.diasExecucao.split(",").map((d: string) => parseInt(d.trim())).filter((n: number) => !isNaN(n));
      onEditClient(client.id, { ...data, diasExecucao: dias });
    } else {
      onEditClient(client.id, data);
    }
    setOpen(false);
  };

  const selectedConsultas: string[] = isHefsys ? (watch("consultas") || []) : [];

  const toggleConsulta = (id: string) => {
    const current = selectedConsultas;
    const next = current.includes(id) ? current.filter((c: string) => c !== id) : [...current, id];
    setValue("consultas", next, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Editar Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome da Empresa</Label>
              <Input {...register("nome")} className="mt-1 bg-secondary border-border" />
              {errors.nome && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.nome as any).message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contato</Label>
              <Input {...register("contato")} className="mt-1 bg-secondary border-border" />
              {errors.contato && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.contato as any).message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Input {...register("whatsapp")} placeholder="(81) 99999-0000" className="mt-1 bg-secondary border-border" />
              {errors.whatsapp && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.whatsapp as any).message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input {...register("email")} type="email" className="mt-1 bg-secondary border-border" />
              {errors.email && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.email as any).message}</p>}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <select {...register("status")} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          {isHefsys && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Quantidade de CNPJs</Label>
                  <Input {...register("cnpjs")} type="number" min={1} className="mt-1 bg-secondary border-border" />
                  {errors.cnpjs && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.cnpjs as any).message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Frequência</Label>
                  <select {...register("frequencia")} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                    {FREQUENCIAS.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Dias de Execução (separados por vírgula)</Label>
                <Input {...register("diasExecucao")} placeholder="1, 15" className="mt-1 bg-secondary border-border" />
                {errors.diasExecucao && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.diasExecucao as any).message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Faturamento Mensal (R$)</Label>
                  <Input {...register("faturamento")} type="number" min={0} step={100} className="mt-1 bg-secondary border-border" />
                  {errors.faturamento && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.faturamento as any).message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Custo API Mensal (R$)</Label>
                  <Input {...register("custoAPI")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                  {errors.custoAPI && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.custoAPI as any).message}</p>}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Consultas / Certidões</Label>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5">Certidões</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CONSULTAS_CERTIDOES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleConsulta(c.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            selectedConsultas.includes(c.id)
                              ? "bg-clix-info/20 text-clix-info border border-clix-info/30"
                              : "bg-secondary text-muted-foreground border border-border hover:border-clix-info/30"
                          }`}
                        >
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1.5">Caixas Postais</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CONSULTAS_CAIXAS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleConsulta(c.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-colors ${
                            selectedConsultas.includes(c.id)
                              ? "bg-clix-magenta/20 text-clix-magenta border border-clix-magenta/30"
                              : "bg-secondary text-muted-foreground border border-border hover:border-clix-magenta/30"
                          }`}
                        >
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {errors.consultas && <p className="text-[11px] text-clix-danger mt-1">{(errors.consultas as any).message}</p>}
              </div>
            </>
          )}

          {!isHefsys && (
            <div>
              <Label className="text-xs text-muted-foreground">Valor do Contrato (R$/mês)</Label>
              <Input {...register("valorContrato")} type="number" min={0} step={100} className="mt-1 bg-secondary border-border" />
              {errors.valorContrato && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.valorContrato as any).message}</p>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
              Salvar Alterações
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
