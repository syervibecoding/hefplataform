import { useState } from "react";
import { LifeBuoy, Copy, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSupportTickets, useClientSupport, useClientSupportSettings, STATUS_META, CATEGORIA_META, type SupportTicket } from "@/hooks/useSupport";
import SupportTicketDialog from "./SupportTicketDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { clientId: string; clientName: string; }

export default function CompanySupportSection({ clientId, clientName }: Props) {
  const { data: cfg } = useClientSupport(clientId);
  const settings = useClientSupportSettings();
  const { data: tickets = [] } = useSupportTickets(clientId);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [copied, setCopied] = useState(false);

  const portalUrl = cfg?.support_slug ? `${window.location.origin}/suporte/p/${cfg.support_slug}` : "";

  const copy = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LifeBuoy size={16} className="text-primary" />
          <h3 className="text-sm font-bold">Suporte</h3>
          <Badge variant="secondary" className="text-[10px]">{tickets.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`support-toggle-${clientId}`} className="text-xs">Portal ativo</Label>
          <Switch
            id={`support-toggle-${clientId}`}
            checked={!!cfg?.support_enabled}
            onCheckedChange={(v) => settings.mutate({ id: clientId, support_enabled: v })}
          />
        </div>
      </div>

      {cfg?.support_enabled && portalUrl && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border">
          <Input readOnly value={portalUrl} className="bg-transparent border-0 text-xs font-mono h-8" />
          <Button size="sm" variant="ghost" onClick={copy} className="gap-1.5">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
          <a href={portalUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {tickets.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Nenhum chamado ainda.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const meta = STATUS_META[t.status];
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left p-3 rounded-lg border border-border bg-secondary/30 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{CATEGORIA_META[t.categoria].label}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(t.opened_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.cls}`}>{meta.label}</Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <SupportTicketDialog ticket={selected} clientName={clientName} onClose={() => setSelected(null)} />
    </div>
  );
}