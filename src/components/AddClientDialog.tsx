import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Check, ChevronsUpDown, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ProductId, type ScheduleConfig, type ConsultaExtra, CONSULTAS_CERTIDOES, CONSULTAS_CAIXAS, FREQUENCIAS } from "@/data/constants";
import ScheduleInput from "@/components/ScheduleInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useDistinctClients, type DistinctClient } from "@/hooks/useDistinctClients";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

const baseSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(100),
  contato: z.string().trim().min(1, "Contato é obrigatório").max(100),
  whatsapp: z.string().trim().min(1, "WhatsApp é obrigatório").max(20),
  email: z.string().trim().email("Email inválido").max(255),
  status: z.enum(["ativo", "inativo"]),
  contratoAssinado: z.boolean().optional(),
});

const hefsysSchema = baseSchema.extend({
  cnpjs: z.coerce.number().min(1, "Mínimo 1 CNPJ"),
  consultas: z.array(z.string()).min(1, "Selecione ao menos 1 consulta"),
  frequencia: z.string().min(1, "Selecione a frequência"),
  faturamento: z.coerce.number().min(0, "Valor inválido"),
  custoAPI: z.coerce.number().min(0, "Valor inválido"),
  diaPagamento: z.coerce.number().min(1).max(31).optional(),
  dataInicio: z.string().optional(),
});

const genericSchema = baseSchema.extend({
  valorContrato: z.coerce.number().min(0, "Valor inválido"),
  diaPagamento: z.coerce.number().min(1).max(31).optional(),
  dataInicio: z.string().optional(),
  dataKickoff: z.string().optional(),
  nivelDificuldade: z.string().optional(),
  notasAutomacao: z.string().optional(),
  nomePlataforma: z.string().optional(),
  tipoPlataforma: z.string().optional(),
  valorImplementacao: z.coerce.number().min(0).optional(),
  dataImplementacao: z.string().optional(),
  temMensalidade: z.boolean().optional(),
  valorMensalidade: z.coerce.number().min(0).optional(),
  comissaoPercentual: z.coerce.number().min(0).max(100).optional(),
  comissaoComercial: z.string().optional(),
});

const trafegoSchema = baseSchema.extend({
  valorContrato: z.coerce.number().min(0, "Valor inválido"),
  diaPagamento: z.coerce.number().min(1).max(31).optional(),
  dataInicio: z.string().optional(),
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
  const isAutomacao = activeProduct === "automacao";
  const isPlataformas = activeProduct === "plataformas";
  const isConsultoria = activeProduct === "consultoria-clix";
  const [agendaCertidoes, setAgendaCertidoes] = useState<ScheduleConfig>({});
  const [agendaCaixasPostais, setAgendaCaixasPostais] = useState<ScheduleConfig>({});
  const [rotinaConferencia, setRotinaConferencia] = useState<ScheduleConfig>({});
  const [consultasExtras, setConsultasExtras] = useState<ConsultaExtra[]>([]);
  const [linkedFrom, setLinkedFrom] = useState<DistinctClient | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const { data: distinctClients = [] } = useDistinctClients();
  const { products } = useProducts();
  const productNameById = (id: string) => products.find((p) => p.id === id)?.nome || id;

  const hefsysForm = useForm<HefsysForm>({
    resolver: zodResolver(hefsysSchema),
    defaultValues: { nome: "", contato: "", whatsapp: "", email: "", status: "ativo", cnpjs: 1, consultas: [], frequencia: "1x", faturamento: 0, custoAPI: 0, diaPagamento: 5 },
  });

  const genericForm = useForm<GenericForm>({
    resolver: zodResolver(genericSchema),
    defaultValues: { nome: "", contato: "", whatsapp: "", email: "", status: "ativo", valorContrato: 0, diaPagamento: 5, dataKickoff: "", nivelDificuldade: "", notasAutomacao: "", nomePlataforma: "", tipoPlataforma: "", valorImplementacao: 0, dataImplementacao: "", temMensalidade: false, valorMensalidade: 0, comissaoPercentual: 0, comissaoComercial: "" },
  });

  const trafegoForm = useForm<TrafegoForm>({
    resolver: zodResolver(trafegoSchema),
    defaultValues: { nome: "", contato: "", whatsapp: "", email: "", status: "ativo", valorContrato: 0, diaPagamento: 5, formaPagamento: "", saldoAnuncio: 0, gastoDiarioMedio: 0, dataDeposito: "" },
  });

  const form = isHefsys ? hefsysForm : isTrafego ? trafegoForm : genericForm;
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form as any;

  const formaPagamento = isTrafego ? watch("formaPagamento") : "";

  const onSubmit = (data: any) => {
    if (isHefsys) {
      onAddClient({ ...data, dataInicio: data.dataInicio || null, agendaCertidoes, agendaCaixasPostais, consultasExtras });
    } else if (isTrafego) {
      onAddClient({
        ...data,
        dataInicio: data.dataInicio || null,
        rotinaConferencia,
        formaPagamento: data.formaPagamento || null,
        saldoAnuncio: data.formaPagamento === "pix" ? data.saldoAnuncio : 0,
        gastoDiarioMedio: data.formaPagamento === "pix" ? data.gastoDiarioMedio : 0,
        dataDeposito: data.formaPagamento === "pix" ? data.dataDeposito || null : null,
      });
    } else {
      // Compute goLive from kickoff + difficulty
      const kickoff = data.dataKickoff || null;
      const nivel = data.nivelDificuldade || null;
      let goLive: string | null = null;
      if (kickoff && nivel) {
        const days = nivel === "facil" ? 7 : nivel === "medio" ? 15 : nivel === "dificil" ? 21 : 0;
        const d = new Date(kickoff + "T00:00:00");
        d.setDate(d.getDate() + days);
        goLive = d.toISOString().split("T")[0];
      }
      onAddClient({
        ...data,
        dataInicio: data.dataInicio || null,
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
        comissaoPercentual: Number(data.comissaoPercentual) || 0,
        comissaoComercial: (data.comissaoComercial || "").trim() || null,
      });
    }
    reset();
    setAgendaCertidoes({});
    setAgendaCaixasPostais({});
    setRotinaConferencia({});
    setConsultasExtras([]);
    setOpen(false);
    setLinkedFrom(null);
  };

  const addConsultaExtra = () => {
    setConsultasExtras([...consultasExtras, { id: `custom_${Date.now()}`, nome: "", agenda: {} }]);
  };

  const removeConsultaExtra = (id: string) => {
    setConsultasExtras(consultasExtras.filter((c) => c.id !== id));
  };

  const updateConsultaExtra = (id: string, field: keyof ConsultaExtra, val: any) => {
    setConsultasExtras(consultasExtras.map((c) => c.id === id ? { ...c, [field]: val } : c));
  };

  const selectedConsultas: string[] = isHefsys ? (watch("consultas") || []) : [];

  const toggleConsulta = (id: string) => {
    const current = selectedConsultas;
    const next = current.includes(id) ? current.filter((c: string) => c !== id) : [...current, id];
    setValue("consultas", next, { shouldValidate: true });
  };

  const hasCertidoes = selectedConsultas.some((id: string) => CONSULTAS_CERTIDOES.some((c) => c.id === id));
  const hasCaixas = selectedConsultas.some((id: string) => CONSULTAS_CAIXAS.some((c) => c.id === id));

  const applyExistingClient = (c: DistinctClient) => {
    setValue("nome", c.nome, { shouldValidate: true });
    setValue("contato", c.contato, { shouldValidate: true });
    setValue("whatsapp", c.whatsapp, { shouldValidate: true });
    setValue("email", c.email, { shouldValidate: true });
    setValue("status", c.status || "ativo", { shouldValidate: true });
    setLinkedFrom(c);
    setComboOpen(false);
  };

  const clearLinkedClient = () => {
    setLinkedFrom(null);
    setValue("nome", "", { shouldValidate: false });
    setValue("contato", "", { shouldValidate: false });
    setValue("whatsapp", "", { shouldValidate: false });
    setValue("email", "", { shouldValidate: false });
  };

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
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Reaproveitar cliente existente (opcional)</Label>
              {linkedFrom && (
                <button type="button" onClick={clearLinkedClient} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <X size={11} /> Limpar
                </button>
              )}
            </div>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  className="w-full h-10 px-3 rounded-md border border-border bg-secondary text-sm flex items-center justify-between text-left"
                >
                  <span className={cn("truncate", !linkedFrom && "text-muted-foreground")}>
                    {linkedFrom ? linkedFrom.nome : "Buscar cliente já cadastrado…"}
                  </span>
                  <ChevronsUpDown size={14} className="opacity-50 shrink-0 ml-2" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border-border" align="start">
                <Command>
                  <CommandInput placeholder="Digite o nome da empresa…" className="h-9" />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {distinctClients.map((c) => {
                        const already = c.productsIn.includes(activeProduct);
                        return (
                          <CommandItem
                            key={c.nome}
                            value={c.nome}
                            disabled={already}
                            onSelect={() => !already && applyExistingClient(c)}
                            className={cn("flex items-start gap-2", already && "opacity-50 cursor-not-allowed")}
                          >
                            <Check size={14} className={cn("mt-0.5", linkedFrom?.nome === c.nome ? "opacity-100" : "opacity-0")} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{c.nome}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {c.productsIn.map(productNameById).join(" · ") || "—"}
                                {already && " (já neste produto)"}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {linkedFrom && (
              <p className="text-[10px] text-hef-info">
                Dados copiados de {linkedFrom.productsIn.map(productNameById).join(", ") || "outro produto"}. Edite se necessário.
              </p>
            )}
          </div>

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

          <div>
            <Label className="text-xs text-muted-foreground">Dia de pagamento (1–31)</Label>
            <Input {...register("diaPagamento")} type="number" min={1} max={31} className="mt-1 bg-secondary border-border" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Data de início (cobrança)</Label>
            <Input {...register("dataInicio")} type="date" className="mt-1 bg-secondary border-border" />
            <p className="text-[10px] text-muted-foreground mt-1">Mês em que a receita deste cliente começa a entrar no fluxo de caixa.</p>
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
                  <button type="button" onClick={addConsultaExtra} className="text-[11px] px-2 py-1 rounded-md font-semibold bg-hef-success/10 text-hef-success hover:bg-hef-success/20 transition-colors flex items-center gap-1">
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                {consultasExtras.map((extra) => (
                  <div key={extra.id} className="space-y-2 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Input
                        value={extra.nome}
                        onChange={(e) => updateConsultaExtra(extra.id, "nome", e.target.value)}
                        placeholder="Nome da consulta (ex: Credenciamento)"
                        className="h-8 text-xs bg-secondary border-border flex-1"
                      />
                      <button type="button" onClick={() => removeConsultaExtra(extra.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <ScheduleInput
                      label={`Agenda: ${extra.nome || "Nova Consulta"}`}
                      value={extra.agenda}
                      onChange={(agenda) => updateConsultaExtra(extra.id, "agenda", agenda)}
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
              {!isPlataformas && (
                <div>
                  <Label className="text-xs text-muted-foreground">Valor do Contrato (R$/mês)</Label>
                  <Input {...register("valorContrato")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                  {errors.valorContrato && <p className="text-[11px] text-hef-danger mt-0.5">{(errors.valorContrato as any).message}</p>}
                </div>
              )}

              {isConsultoria && (
                <div className="space-y-3 p-3 bg-hef-warning/5 border border-hef-warning/20 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wider text-hef-warning font-semibold">Comissão do Comercial</p>
                  <p className="text-[10px] text-muted-foreground">Enquanto o cliente estiver ativo, gera uma despesa mensal = % × valor do contrato.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Percentual (%)</Label>
                      <Input {...register("comissaoPercentual")} type="number" min={0} max={100} step={0.01} className="mt-1 bg-secondary border-border" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Comercial responsável</Label>
                      <Input {...register("comissaoComercial")} placeholder="Nome do comercial" className="mt-1 bg-secondary border-border" />
                    </div>
                  </div>
                </div>
              )}

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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor da Implementação (R$)</Label>
                      <Input {...register("valorImplementacao")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data da Implementação</Label>
                      <Input {...register("dataImplementacao")} type="date" className="mt-1 bg-secondary border-border" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      {...register("temMensalidade")}
                      className="h-4 w-4 rounded border-border bg-secondary accent-primary"
                    />
                    <span className="text-xs text-muted-foreground">Possui mensalidade recorrente</span>
                  </label>
                  {watch("temMensalidade") && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor Mensal (R$)</Label>
                      <Input {...register("valorMensalidade")} type="number" min={0} step={0.01} className="mt-1 bg-secondary border-border" />
                    </div>
                  )}
                </div>
              )}
            </>
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
