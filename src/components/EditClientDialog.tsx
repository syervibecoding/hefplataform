import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ProductId, type AnyClient, type GenericClient, type ScheduleConfig, type ConsultaExtra, isHefSysClient, CONSULTAS_CERTIDOES, CONSULTAS_CAIXAS, FREQUENCIAS } from "@/data/constants";
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
  dataKickoff: z.string().optional(),
  nivelDificuldade: z.string().optional(),
  notasAutomacao: z.string().optional(),
  nomePlataforma: z.string().optional(),
  tipoPlataforma: z.string().optional(),
  valorImplementacao: z.coerce.number().min(0).optional(),
  dataImplementacao: z.string().optional(),
  temMensalidade: z.boolean().optional(),
  valorMensalidade: z.coerce.number().min(0).optional(),
});

const trafegoSchema = baseSchema.extend({
  valorContrato: z.coerce.number().min(0, "Valor inválido"),
  formaPagamento: z.string().optional(),
  saldoAnuncio: z.coerce.number().min(0).optional(),
  gastoDiarioMedio: z.coerce.number().min(0).optional(),
  dataDeposito: z.string().optional(),
});

interface Props {
  client: AnyClient;
  activeProduct: ProductId;
  onEditClient: (id: string, data: any) => void;
}

export default function EditClientDialog({ client, activeProduct, onEditClient }: Props) {
  const [open, setOpen] = useState(false);
  const isHefsys = activeProduct === "hefsys";
  const isTrafego = activeProduct === "trafego";
  const isAutomacao = activeProduct === "automacao";
  const isPlataformas = activeProduct === "plataformas";
  const [agendaCertidoes, setAgendaCertidoes] = useState<ScheduleConfig>({});
  const [agendaCaixasPostais, setAgendaCaixasPostais] = useState<ScheduleConfig>({});
  const [rotinaConferencia, setRotinaConferencia] = useState<ScheduleConfig>({});
  const [consultasExtras, setConsultasExtras] = useState<ConsultaExtra[]>([]);

  const hefsysForm = useForm<z.infer<typeof hefsysSchema>>({
    resolver: zodResolver(hefsysSchema),
  });

  const genericForm = useForm<z.infer<typeof genericSchema>>({
    resolver: zodResolver(genericSchema),
  });

  const trafegoForm = useForm<z.infer<typeof trafegoSchema>>({
    resolver: zodResolver(trafegoSchema),
  });

  const form = isHefsys ? hefsysForm : isTrafego ? trafegoForm : genericForm;
  const { register, handleSubmit, formState: { errors }, setValue, watch } = form as any;

  const formaPagamento = isTrafego ? watch("formaPagamento") : "";

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
          faturamento: client.faturamento || 0,
          custoAPI: client.custoAPI || 0,
        });
        setAgendaCertidoes(client.agendaCertidoes || {});
        setAgendaCaixasPostais(client.agendaCaixasPostais || {});
        setConsultasExtras(client.consultasExtras || []);
      } else if (isTrafego && !isHefSysClient(client)) {
        const gc = client as GenericClient;
        trafegoForm.reset({
          nome: gc.nome,
          contato: gc.contato,
          whatsapp: gc.whatsapp,
          email: gc.email,
          status: gc.status,
          valorContrato: gc.valorContrato,
          formaPagamento: gc.formaPagamento || "",
          saldoAnuncio: gc.saldoAnuncio || 0,
          gastoDiarioMedio: gc.gastoDiarioMedio || 0,
          dataDeposito: gc.dataDeposito || "",
        });
        setRotinaConferencia(gc.rotinaConferencia || {});
      } else if (!isHefSysClient(client)) {
        genericForm.reset({
          nome: client.nome,
          contato: client.contato,
          whatsapp: client.whatsapp,
          email: client.email,
          status: client.status,
          valorContrato: client.valorContrato,
          dataKickoff: client.dataKickoff || "",
          nivelDificuldade: client.nivelDificuldade || "",
          notasAutomacao: client.notasAutomacao || "",
          nomePlataforma: client.nomePlataforma || "",
          tipoPlataforma: client.tipoPlataforma || "",
          valorImplementacao: client.valorImplementacao || 0,
          dataImplementacao: client.dataImplementacao || "",
          temMensalidade: !!client.temMensalidade,
          valorMensalidade: client.valorMensalidade || 0,
        });
      }
    }
  }, [open]);

  const onSubmit = (data: any) => {
    if (isHefsys) {
      onEditClient(client.id, { ...data, agendaCertidoes, agendaCaixasPostais, consultasExtras });
    } else if (isTrafego) {
      onEditClient(client.id, {
        ...data,
        rotinaConferencia,
        formaPagamento: data.formaPagamento || null,
        saldoAnuncio: data.formaPagamento === "pix" ? data.saldoAnuncio : 0,
        gastoDiarioMedio: data.formaPagamento === "pix" ? data.gastoDiarioMedio : 0,
        dataDeposito: data.formaPagamento === "pix" ? data.dataDeposito || null : null,
      });
    } else {
      const kickoff = data.dataKickoff || null;
      const nivel = data.nivelDificuldade || null;
      let goLive: string | null = null;
      if (kickoff && nivel) {
        const days = nivel === "facil" ? 7 : nivel === "medio" ? 15 : nivel === "dificil" ? 21 : 0;
        const d = new Date(kickoff + "T00:00:00");
        d.setDate(d.getDate() + days);
        goLive = d.toISOString().split("T")[0];
      }
      onEditClient(client.id, {
        ...data,
        dataKickoff: kickoff,
        dataGoLive: goLive,
        nivelDificuldade: nivel,
        notasAutomacao: data.notasAutomacao || null,
        nomePlataforma: data.nomePlataforma || null,
        tipoPlataforma: data.tipoPlataforma || null,
        valorImplementacao: Number(data.valorImplementacao) || 0,
        dataImplementacao: data.dataImplementacao || null,
        temMensalidade: !!data.temMensalidade,
        valorMensalidade: data.temMensalidade ? (Number(data.valorMensalidade) || 0) : 0,
      });
    }
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
              {errors.nome && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.nome as any).message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contato</Label>
              <Input {...register("contato")} className="mt-1 bg-secondary border-border" />
              {errors.contato && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.contato as any).message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Input {...register("whatsapp")} placeholder="(81) 99999-0000" className="mt-1 bg-secondary border-border" />
              {errors.whatsapp && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.whatsapp as any).message}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input {...register("email")} type="email" className="mt-1 bg-secondary border-border" />
              {errors.email && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.email as any).message}</p>}
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
                  {errors.cnpjs && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.cnpjs as any).message}</p>}
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
                  colorClass="text-hef-info"
                />
              )}
              {hasCaixas && (
                <ScheduleInput
                  label="Agenda das Caixas Postais"
                  value={agendaCaixasPostais}
                  onChange={setAgendaCaixasPostais}
                  colorClass="text-hef-info"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Faturamento Mensal (R$)</Label>
                  <Input {...register("faturamento")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                  {errors.faturamento && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.faturamento as any).message}</p>}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Custo API Mensal (R$)</Label>
                  <Input {...register("custoAPI")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                  {errors.custoAPI && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.custoAPI as any).message}</p>}
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
                              ? "bg-hef-info/20 text-hef-info border border-hef-info/30"
                              : "bg-secondary text-muted-foreground border border-border hover:border-hef-info/30"
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
                              ? "bg-hef-info/20 text-hef-info border border-hef-info/30"
                              : "bg-secondary text-muted-foreground border border-border hover:border-hef-info/30"
                          }`}
                        >
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {errors.consultas && <p className="text-[11px] text-hef-danger mt-1">{(errors.consultas as any).message}</p>}
              </div>

              {/* Consultas Extras */}
              <div className="space-y-3 p-3 bg-hef-success/5 border border-hef-success/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-hef-success font-semibold">Consultas Extras</p>
                  <button type="button" onClick={() => setConsultasExtras([...consultasExtras, { id: `custom_${Date.now()}`, nome: "", agenda: {} }])} className="text-[11px] px-2 py-1 rounded-md font-semibold bg-hef-success/10 text-hef-success hover:bg-hef-success/20 transition-colors flex items-center gap-1">
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                {consultasExtras.map((extra) => (
                  <div key={extra.id} className="space-y-2 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Input
                        value={extra.nome}
                        onChange={(e) => setConsultasExtras(consultasExtras.map((c) => c.id === extra.id ? { ...c, nome: e.target.value } : c))}
                        placeholder="Nome da consulta (ex: Credenciamento)"
                        className="h-8 text-xs bg-secondary border-border flex-1"
                      />
                      <button type="button" onClick={() => setConsultasExtras(consultasExtras.filter((c) => c.id !== extra.id))} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <ScheduleInput
                      label={`Agenda: ${extra.nome || "Nova Consulta"}`}
                      value={extra.agenda}
                      onChange={(agenda) => setConsultasExtras(consultasExtras.map((c) => c.id === extra.id ? { ...c, agenda } : c))}
                      colorClass="text-hef-success"
                    />
                  </div>
                ))}
                {consultasExtras.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Nenhuma consulta extra adicionada.</p>
                )}
              </div>
            </>
          )}

          {isTrafego && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Valor do Contrato (R$/mês)</Label>
                <Input {...register("valorContrato")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                {errors.valorContrato && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.valorContrato as any).message}</p>}
              </div>

              <ScheduleInput
                label="Rotina de Conferência de Anúncios"
                value={rotinaConferencia}
                onChange={setRotinaConferencia}
                colorClass="text-hef-warning"
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
                <div className="space-y-3 p-3 bg-hef-warning/5 border border-hef-warning/20 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-hef-warning font-semibold">Controle de Saldo PIX</p>
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
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Valor do Contrato (R$/mês)</Label>
                <Input {...register("valorContrato")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                {errors.valorContrato && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.valorContrato as any).message}</p>}
              </div>

              {isAutomacao && (
                <div className="space-y-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">Automação IA</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data do Kickoff</Label>
                      <Input {...register("dataKickoff")} type="date" className="mt-1 bg-secondary border-border" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Nível de Dificuldade</Label>
                      <select {...register("nivelDificuldade")} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                        <option value="">Selecione</option>
                        <option value="facil">Fácil (7 dias)</option>
                        <option value="medio">Médio (15 dias)</option>
                        <option value="dificil">Difícil (21 dias)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Notas / Regras / Entregáveis</Label>
                    <textarea {...register("notasAutomacao")} rows={3} className="w-full mt-1 rounded-md border border-border bg-secondary px-3 py-2 text-sm resize-none" placeholder="Regras e entregáveis do projeto..." />
                  </div>
                </div>
              )}

              {isPlataformas && (
                <div className="space-y-3 p-3 bg-hef-info/5 border border-hef-info/20 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-hef-info font-semibold">Plataforma IA</p>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nome da Plataforma</Label>
                    <Input {...register("nomePlataforma")} className="mt-1 bg-secondary border-border" placeholder="Ex: ChatBot de Vendas" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <select {...register("tipoPlataforma")} className="w-full mt-1 h-10 rounded-md border border-border bg-secondary px-3 text-sm">
                      <option value="">Selecione</option>
                      <option value="interna">Interna</option>
                      <option value="externa">Externa (Cliente)</option>
                    </select>
                  </div>
                </div>
              )}
            </>
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
