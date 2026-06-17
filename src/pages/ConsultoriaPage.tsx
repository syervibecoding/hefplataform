import { useState } from "react";
import { ArrowLeft, Plus, FileText, Calendar } from "lucide-react";
import type { ConsultoriaClient } from "@/data/consultoria";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  clients: ConsultoriaClient[];
  onAddClient: (nome: string, tipo: string, dataInicio: string) => void;
  onOpenReport: (id: string) => void;
  onNavigate: (page: string) => void;
}

function formatBR(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function ConsultoriaPage({
  clients,
  onAddClient,
  onOpenReport,
  onNavigate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Consultoria em IA");
  const [dataInicio, setDataInicio] = useState("");

  const reset = () => {
    setNome("");
    setTipo("Consultoria em IA");
    setDataInicio("");
  };

  const handleSave = () => {
    if (!nome || !tipo || !dataInicio) return;
    onAddClient(nome, tipo, dataInicio);
    reset();
    setOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <button
        onClick={() => onNavigate("operacional")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para Operacional
      </button>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight">
            Consultoria
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhamento das melhorias contínuas por cliente.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all"
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum cliente de consultoria ainda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((c) => {
            const total = c.relatorio.entregas.length;
            const prod = c.relatorio.entregas.filter(
              (e) => e.status === "em_producao"
            ).length;
            return (
              <div
                key={c.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wide bg-primary/12 text-primary px-2 py-0.5 rounded-md font-semibold">
                      {c.tipoConsultoria}
                    </span>
                  </div>
                  <div className="font-heading font-bold text-lg mt-2">
                    {c.nome}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Calendar size={12} />
                    Início em {formatBR(c.dataInicio)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <div className="font-mono text-lg font-bold text-primary">
                      {prod}/{total}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      em produção
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenReport(c.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors"
                  >
                    <FileText size={14} />
                    Gerar Relatório
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-bold">
              Novo cliente de consultoria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 bg-secondary border-border"
                placeholder="Ex.: Correta Contabilidade"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Tipo de consultoria
              </Label>
              <Input
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 bg-secondary border-border"
                placeholder="Ex.: Consultoria em IA"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Data de início
              </Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!nome || !tipo || !dataInicio}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}