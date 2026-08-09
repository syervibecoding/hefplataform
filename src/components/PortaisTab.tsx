import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Copy, Search, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClientSupportSettings } from "@/hooks/useSupport";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Row {
  id: string;
  nome: string;
  support_slug: string | null;
  support_enabled: boolean;
}

function usePortalClients() {
  return useQuery({
    queryKey: ["portal_clients_admin"],
    queryFn: async () => {
      const [{ data: clients, error }, { data: links, error: lErr }] = await Promise.all([
        supabase.from("clients").select("id, nome, support_slug, support_enabled").order("nome"),
        supabase.from("lovable_product_clients").select("client_id"),
      ]);
      if (error) throw error;
      if (lErr) throw lErr;
      const counts: Record<string, number> = {};
      (links ?? []).forEach((l: any) => { counts[l.client_id] = (counts[l.client_id] ?? 0) + 1; });
      return { clients: (clients ?? []) as Row[], counts };
    },
  });
}

export default function PortaisTab() {
  const { data, isLoading } = usePortalClients();
  const settings = useClientSupportSettings();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [onlyWithPlatforms, setOnlyWithPlatforms] = useState(false);

  const rows = useMemo(() => {
    const list = data?.clients ?? [];
    const counts = data?.counts ?? {};
    const s = search.toLowerCase();
    return list.filter((c) => {
      if (onlyWithPlatforms && !(counts[c.id] > 0)) return false;
      return !s || c.nome.toLowerCase().includes(s);
    });
  }, [data, search, onlyWithPlatforms]);

  const counts = data?.counts ?? {};
  const enabledCount = (data?.clients ?? []).filter((c) => c.support_enabled).length;

  const urlFor = (slug: string | null) =>
    slug ? `${window.location.origin}/suporte/p/${slug}` : "";

  const copy = async (c: Row) => {
    const url = urlFor(c.support_slug);
    if (!url) return toast.error("Cliente sem link gerado");
    await navigator.clipboard.writeText(url);
    toast.success(`Link de ${c.nome} copiado`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={onlyWithPlatforms} onCheckedChange={setOnlyWithPlatforms} />
          Só com plataformas vinculadas
        </label>
        <Badge variant="outline" className="text-[10px] ml-auto">
          {enabledCount} portal{enabledCount === 1 ? "" : "is"} ativo{enabledCount === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((c) => {
              const n = counts[c.id] ?? 0;
              const url = urlFor(c.support_slug);
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-semibold truncate">{c.nome}</p>
                    {c.support_enabled && url ? (
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{url}</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Portal desativado</p>
                    )}
                  </div>

                  {n > 0 ? (
                    <Badge variant="outline" className="text-[10px]">{n} plataforma{n === 1 ? "" : "s"}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10">
                      <AlertTriangle size={11} /> sem plataforma
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!c.support_enabled || !url}
                            title="Copiar link" onClick={() => copy(c)}>
                      <Copy size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!c.support_enabled || !url}
                            title="Abrir portal" onClick={() => window.open(url, "_blank")}>
                      <ExternalLink size={13} />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link2 size={13} className="text-muted-foreground" />
                    <Switch
                      checked={c.support_enabled}
                      disabled={settings.isPending}
                      onCheckedChange={(v) =>
                        settings.mutate(
                          { id: c.id, support_enabled: v },
                          { onSuccess: () => qc.invalidateQueries({ queryKey: ["portal_clients_admin"] }) }
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Cada link é exclusivo e secreto: o cliente enxerga apenas as plataformas vinculadas a ele e os próprios chamados.
      </p>
    </div>
  );
}