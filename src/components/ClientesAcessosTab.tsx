import { useMemo, useState } from "react";
import { Plus, KeyRound, Building2, Search, ShieldCheck, Pencil, Trash2 } from "lucide-react";
import { useLovableProducts } from "@/hooks/useLovableProducts";
import {
  usePlatformCompanies,
  useCompanyProductLinks,
  usePlatformCompanyMutations,
  type PlatformCompany,
} from "@/hooks/usePlatformCompanies";
import { useClientAccessProfiles, useCreateClientAccess } from "@/hooks/useClientAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ClientesAcessosTab() {
  const { data: companies = [], isLoading } = usePlatformCompanies();
  const { data: links = [] } = useCompanyProductLinks();
  const { products } = useLovableProducts();
  const { data: accessProfiles = [] } = useClientAccessProfiles();
  const { create, remove } = usePlatformCompanyMutations();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlatformCompany | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  // form state for create-company dialog
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [obs, setObs] = useState("");

  const accessByCompany = useMemo(() => {
    const m: Record<string, typeof accessProfiles> = {};
    accessProfiles.forEach((p) => {
      if (!p.platform_company_id) return;
      (m[p.platform_company_id] ||= []).push(p);
    });
    return m;
  }, [accessProfiles]);

  const productsByCompany = useMemo(() => {
    const m: Record<string, string[]> = {};
    links.forEach((l) => {
      (m[l.company_id] ||= []).push(l.product_id);
    });
    return m;
  }, [links]);

  const filtered = companies.filter((c) => {
    const s = search.toLowerCase();
    if (!s) return true;
    return c.nome.toLowerCase().includes(s) || (c.email ?? "").toLowerCase().includes(s);
  });

  const selected = companies.find((c) => c.id === selectedId) ?? null;

  const submitCreate = () => {
    if (!nome.trim()) {
      toast({ title: "Informe o nome da empresa", variant: "destructive" });
      return;
    }
    create.mutate(
      { nome, email, observacoes: obs },
      {
        onSuccess: (c) => {
          setNome(""); setEmail(""); setObs("");
          setOpenCreate(false);
          setSelectedId(c.id);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 bg-secondary border-border"
          />
        </div>
        <Button size="sm" onClick={() => setOpenCreate(true)} className="gap-1.5">
          <Plus size={14} /> Nova empresa
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-6">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-sm text-muted-foreground">
          Nenhuma empresa cadastrada. Clique em <strong>Nova empresa</strong> para começar.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map((c) => {
            const accesses = accessByCompany[c.id] ?? [];
            const platformCount = (productsByCompany[c.id] ?? []).length;
            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                <button onClick={() => setSelectedId(c.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{c.email || "Sem e-mail de contato"}</p>
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
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedId(c.id)}>
                  <Pencil size={13} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(c)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create company dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nova empresa de plataforma</DialogTitle>
            <DialogDescription>Independente dos clientes operacionais.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)}
                     placeholder="Ex.: ACME Ltda" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs">E-mail de contato</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="contato@empresa.com" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs">Observações</Label>
              <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
                        className="mt-1 bg-secondary border-border" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button size="sm" onClick={submitCreate} disabled={create.isPending} className="gap-1.5">
                <Plus size={13} /> Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CompanyManageDialog
        company={selected}
        accesses={selected ? accessByCompany[selected.id] ?? [] : []}
        productIds={selected ? productsByCompany[selected.id] ?? [] : []}
        products={products}
        onClose={() => setSelectedId(null)}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.nome}" e todas as liberações de plataforma serão excluídas.
              Os logins ficam órfãos e perdem acesso ao portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) remove.mutate(confirmDelete.id);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CompanyManageDialog({
  company, accesses, productIds, products, onClose,
}: {
  company: PlatformCompany | null;
  accesses: { id: string; username: string; display_name: string | null }[];
  productIds: string[];
  products: Array<{ id: string; nome: string }>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { update, linkProduct, unlinkProduct } = usePlatformCompanyMutations();
  const createAccess = useCreateClientAccess();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [obs, setObs] = useState("");
  const [accessEmail, setAccessEmail] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [accessName, setAccessName] = useState("");

  // Reset form fields when company changes
  useMemo(() => {
    setNome(company?.nome ?? "");
    setEmail(company?.email ?? "");
    setObs(company?.observacoes ?? "");
    setAccessEmail(""); setAccessPassword(""); setAccessName("");
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!company) return null;

  const saveInfo = () => {
    update.mutate({
      id: company.id,
      patch: { nome: nome.trim(), email: email.trim() || null, observacoes: obs.trim() || null },
    });
  };

  const submitAccess = () => {
    if (!accessEmail.includes("@") || accessPassword.length < 6) {
      toast({ title: "E-mail válido e senha de 6+ caracteres", variant: "destructive" });
      return;
    }
    createAccess.mutate(
      {
        email: accessEmail.trim(),
        password: accessPassword,
        display_name: accessName.trim() || undefined,
        platform_company_id: company.id,
      },
      {
        onSuccess: () => {
          toast({ title: "Acesso criado", description: `Login: ${accessEmail}` });
          setAccessEmail(""); setAccessPassword(""); setAccessName("");
        },
        onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={!!company} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 size={16} /> {company.nome}
          </DialogTitle>
          <DialogDescription>Dados da empresa, plataformas liberadas e logins do portal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 bg-secondary border-border" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">E-mail de contato</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                       className="mt-1 bg-secondary border-border" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Observações</Label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
                          className="mt-1 bg-secondary border-border" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={saveInfo} disabled={update.isPending}>Salvar</Button>
            </div>
          </section>

          {/* Platforms */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Plataformas liberadas
            </h3>
            {products.length === 0 ? (
              <p className="text-xs text-muted-foreground">Cadastre plataformas primeiro.</p>
            ) : (
              <div className="space-y-1.5">
                {products.map((p) => {
                  const checked = productIds.includes(p.id);
                  return (
                    <label key={p.id}
                           className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary/50 cursor-pointer text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          if (v) linkProduct.mutate({ company_id: company.id, product_id: p.id });
                          else unlinkProduct.mutate({ company_id: company.id, product_id: p.id });
                        }}
                      />
                      <span className="flex-1">{p.nome}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* Accesses */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Logins do portal
            </h3>
            {accesses.length === 0 ? (
              <p className="text-xs text-muted-foreground mb-2">Nenhum login criado ainda.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {accesses.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/50 text-sm">
                    <KeyRound size={13} className="text-primary" />
                    <span className="font-medium">{a.display_name || a.username}</span>
                    <span className="text-xs text-muted-foreground">({a.username})</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-dashed border-border rounded-lg p-3 space-y-3">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Gerar novo login
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={accessEmail} onChange={(e) => setAccessEmail(e.target.value)}
                         placeholder="usuario@empresa.com" className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-xs">Senha</Label>
                  <Input type="text" value={accessPassword} onChange={(e) => setAccessPassword(e.target.value)}
                         placeholder="Mín. 6 caracteres" className="mt-1 bg-secondary border-border font-mono" />
                </div>
                <div>
                  <Label className="text-xs">Nome de exibição</Label>
                  <Input value={accessName} onChange={(e) => setAccessName(e.target.value)}
                         placeholder="Opcional" className="mt-1 bg-secondary border-border" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" onClick={submitAccess} disabled={createAccess.isPending} className="gap-1.5">
                  <Plus size={13} /> {createAccess.isPending ? "Criando..." : "Criar login"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}