import { useMemo, useState } from "react";
import { Users, Plus, KeyRound, Building2, Search, ExternalLink, ShieldCheck } from "lucide-react";
import { useAllClients } from "@/hooks/useAllClients";
import { useLovableProducts } from "@/hooks/useLovableProducts";
import { useClientAccessProfiles, useCreateClientAccess } from "@/hooks/useClientAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function ClientesAcessosTab() {
  const { data: clients = [], isLoading } = useAllClients();
  const { products, links, linkClient, unlinkClient, clientIdsFor } = useLovableProducts();
  const { data: accessProfiles = [] } = useClientAccessProfiles();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const accessByClient = useMemo(() => {
    const map: Record<string, typeof accessProfiles> = {};
    accessProfiles.forEach((p) => {
      if (!p.client_id) return;
      (map[p.client_id] ||= []).push(p);
    });
    return map;
  }, [accessProfiles]);

  const platformsByClient = useMemo(() => {
    const map: Record<string, string[]> = {};
    links.forEach((l) => {
      (map[l.client_id] ||= []).push(l.product_id);
    });
    return map;
  }, [links]);

  // Distinct clients (clients can repeat if same company with multiple products)
  const uniqueClients = useMemo(() => {
    const map = new Map<string, typeof clients[number]>();
    clients.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [clients]);

  const filtered = uniqueClients.filter((c) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return c.nome.toLowerCase().includes(s) || (c.email ?? "").toLowerCase().includes(s);
  });

  const selectedClient = filtered.find((c) => c.id === selected) ?? uniqueClients.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-6">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          Nenhum cliente.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((c) => {
            const accesses = accessByClient[c.id] ?? [];
            const platformCount = (platformsByClient[c.id] ?? []).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.nome}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.email || "Sem e-mail cadastrado"}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {platformCount} plataforma{platformCount === 1 ? "" : "s"}
                </Badge>
                {accesses.length > 0 ? (
                  <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                    <ShieldCheck size={11} /> {accesses.length} acesso{accesses.length === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Sem acesso</Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      <ClientAccessDialog
        client={selectedClient ?? null}
        accesses={selectedClient ? accessByClient[selectedClient.id] ?? [] : []}
        platformIds={selectedClient ? platformsByClient[selectedClient.id] ?? [] : []}
        products={products}
        onClose={() => setSelected(null)}
        onTogglePlatform={(productId, on, clientId) => {
          if (on) linkClient.mutate({ product_id: productId, client_id: clientId });
          else unlinkClient.mutate({ product_id: productId, client_id: clientId });
        }}
      />
    </div>
  );
}

function ClientAccessDialog({
  client,
  accesses,
  platformIds,
  products,
  onClose,
  onTogglePlatform,
}: {
  client: { id: string; nome: string; email: string } | null;
  accesses: { id: string; username: string; display_name: string | null }[];
  platformIds: string[];
  products: Array<{ id: string; nome: string }>;
  onClose: () => void;
  onTogglePlatform: (productId: string, on: boolean, clientId: string) => void;
}) {
  const open = !!client;
  const { toast } = useToast();
  const createAccess = useCreateClientAccess();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  if (!client) return null;

  const submit = () => {
    if (!email.includes("@") || password.length < 6) {
      toast({ title: "E-mail válido e senha de 6+ caracteres", variant: "destructive" });
      return;
    }
    createAccess.mutate(
      { email: email.trim(), password, display_name: displayName.trim() || undefined, client_id: client.id },
      {
        onSuccess: () => {
          toast({ title: "Acesso criado", description: `Login: ${email}` });
          setEmail("");
          setPassword("");
          setDisplayName("");
        },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={16} /> {client.nome}
          </DialogTitle>
          <DialogDescription>Gerar login e liberar plataformas para este cliente</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Existing accesses */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Acessos existentes
            </h3>
            {accesses.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum acesso criado ainda.</p>
            ) : (
              <div className="space-y-1.5">
                {accesses.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 text-sm">
                    <KeyRound size={13} className="text-primary" />
                    <span className="font-medium">{a.display_name || a.username}</span>
                    <span className="text-xs text-muted-foreground">({a.username})</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Provisioning form */}
          <section className="border border-dashed border-border rounded-lg p-3 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gerar novo acesso
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs">Senha</Label>
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  className="mt-1 bg-secondary border-border font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Nome de exibição (opcional)</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex.: João Silva"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={submit} disabled={createAccess.isPending} className="gap-1.5">
                <Plus size={13} /> {createAccess.isPending ? "Criando..." : "Criar acesso"}
              </Button>
            </div>
          </section>

          {/* Platform access */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Plataformas liberadas
            </h3>
            <p className="text-[11px] text-muted-foreground mb-3">
              Marque as plataformas para as quais este cliente poderá abrir pedidos.
            </p>
            {products.length === 0 ? (
              <p className="text-xs text-muted-foreground">Cadastre plataformas primeiro.</p>
            ) : (
              <div className="space-y-1.5">
                {products.map((p) => {
                  const checked = platformIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/50 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => onTogglePlatform(p.id, !!v, client.id)}
                      />
                      <span className="flex-1">{p.nome}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}