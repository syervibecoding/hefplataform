import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ProductId, type ScheduleConfig, CONSULTAS_CERTIDOES, CONSULTAS_CAIXAS, FREQUENCIAS } from "@/data/constants";
import ScheduleInput from "@/components/ScheduleInput";

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
  faturamento: z.coerce.number().min(0, "Valor inválido"),
  custoAPI: z.coerce.number().min(0, "Valor inválido"),
});

const genericSchema = baseSchema.extend({
  valorContrato: z.coerce.number().min(0, "Valor inválido"),
});

const trafegoSchema = baseSchema.extend({
  valorContrato: z.coerce.number().min(0, "Valor inválido"),
  formaPagamento: z.string().optional(),
  saldoAnuncio: z.coerce.number().min(0).optional(),
  gastoDiarioMedio: z.coerce.number().min(0).optional(),
  dataDeposito: z.string().optional(),
});

type HefsysForm = z.infer<typeof hefsysSchema>;
type GenericForm = z.infer<typeof genericSchema>;
type TrafegoForm = z.infer<typeof trafegoSchema>;

interface Props {
  activeProduct: ProductId;
  onAddClient: (data: any) => void;
}

export default function AddClientDialog({ activeProduct, onAddClient }: Props) {
  const [open, setOpen] = useState(false);
  const isHefsys = activeProduct === "hefsys";
  const isTrafego = activeProduct === "trafego";
  const [agendaCertidoes, setAgendaCertidoes] = useState<ScheduleConfig>({});
  const [agendaCaixasPostais, setAgendaCaixasPostais] = useState<ScheduleConfig>({});
  const [rotinaConferencia, setRotinaConferencia] = useState<ScheduleConfig>({});

  const hefsysForm = useForm<HefsysForm>({
    resolver: zodResolver(hefsysSchema),
    defaultValues: { nome: "", contato: "", whatsapp: "", email: "", status: "ativo", cnpjs: 1, consultas: [], frequencia: "1x", faturamento: 0, custoAPI: 0 },
  });

  const genericForm = useForm<GenericForm>({
    resolver: zodResolver(genericSchema),
    defaultValues: { nome: "", contato: "", whatsapp: "", email: "", status: "ativo", valorContrato: 0 },
  });

  const trafegoForm = useForm<TrafegoForm>({
    resolver: zodResolver(trafegoSchema),
    defaultValues: { nome: "", contato: "", whatsapp: "", email: "", status: "ativo", valorContrato: 0, formaPagamento: "", saldoAnuncio: 0, gastoDiarioMedio: 0, dataDeposito: "" },
  });

  const form = isHefsys ? hefsysForm : isTrafego ? trafegoForm : genericForm;
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form as any;

  const formaPagamento = isTrafego ? watch("formaPagamento") : "";

  const onSubmit = (data: any) => {
    if (isHefsys) {
      onAddClient({ ...data, agendaCertidoes, agendaCaixasPostais });
    } else if (isTrafego) {
      onAddClient({
        ...data,
        rotinaConferencia,
        formaPagamento: data.formaPagamento || null,
        saldoAnuncio: data.formaPagamento === "pix" ? data.saldoAnuncio : 0,
        gastoDiarioMedio: data.formaPagamento === "pix" ? data.gastoDiarioMedio : 0,
        dataDeposito: data.formaPagamento === "pix" ? data.dataDeposito || null : null,
      });
    } else {
      onAddClient(data);
    }
    reset();
    setAgendaCertidoes({});
    setAgendaCaixasPostais({});
    setRotinaConferencia({});
    setOpen(false);
  };

  const selectedConsultas: string[] = isHefsys ? (watch("consultas") || []) : [];

  const toggleConsulta = (id: string) => {
    const current = selectedConsultas;
    const next = current.includes(id) ? current.filter((c: string) => c !== id) : [...current, id];
    setValue("consultas", next, { shouldValidate: true });
  };

  const hasCertidoes = selectedConsultas.some((id: string) => CONSULTAS_CERTIDOES.some((c) => c.id === id));
  const hasCaixas = selectedConsultas.some((id: string) => CONSULTAS_CAIXAS.some((c) => c.id === id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
          <Plus size={14} />
          Novo Cliente
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Novo Cliente</DialogTitle>
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

              {hasCertidoes && (
                <ScheduleInput
                  label="Agenda das Certidões"
                  value={agendaCertidoes}
                  onChange={setAgendaCertidoes}
                  colorClass="text-clix-info"
                />
              )}
              {hasCaixas && (
                <ScheduleInput
                  label="Agenda das Caixas Postais"
                  value={agendaCaixasPostais}
                  onChange={setAgendaCaixasPostais}
                  colorClass="text-clix-magenta"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Faturamento Mensal (R$)</Label>
                  <Input {...register("faturamento")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
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

          {isTrafego && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Valor do Contrato (R$/mês)</Label>
                <Input {...register("valorContrato")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                {errors.valorContrato && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.valorContrato as any).message}</p>}
              </div>

              <ScheduleInput
                label="Rotina de Conferência de Anúncios"
                value={rotinaConferencia}
                onChange={setRotinaConferencia}
                colorClass="text-clix-warning"
              />

              <div>
                <Label className="text-xs text-muted-foreground">Forma de Pagamento do Anúncio</Label>
                <select {...register("formaPagamento")} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                  <option value="">Não informado</option>
                  <option value="pix">PIX</option>
                  <option value="cartao">Cartão de Crédito</option>
                </select>
              </div>

              {formaPagamento === "pix" && (
                <div className="space-y-3 p-3 bg-clix-warning/5 border border-clix-warning/20 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-clix-warning font-semibold">Controle de Saldo PIX</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Saldo Depositado (R$)</Label>
                      <Input {...register("saldoAnuncio")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Gasto Diário Médio (R$)</Label>
                      <Input {...register("gastoDiarioMedio")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Data do Depósito</Label>
                    <Input {...register("dataDeposito")} type="date" className="mt-1 bg-secondary border-border" />
                  </div>
                </div>
              )}
            </>
          )}

          {!isHefsys && !isTrafego && (
            <div>
              <Label className="text-xs text-muted-foreground">Valor do Contrato (R$/mês)</Label>
              <Input {...register("valorContrato")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
              {errors.valorContrato && <p className="text-[11px] text-clix-danger mt-0.5">{(errors.valorContrato as any).message}</p>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all">
              Adicionar Cliente
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
