import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Eye, EyeOff, Upload, Download, FileText, KeyRound, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLovableProducts, type LovableProduct } from "@/hooks/useLovableProducts";
import { useAllClients } from "@/hooks/useAllClients";
import { Checkbox } from "@/components/ui/checkbox";
import {
  usePlatformCredentials,
  usePlatformFiles,
  usePlatformMutations,
  type PlatformCredential,
  type PlatformLink,
} from "@/hooks/usePlatforms";
import { useToast } from "@/hooks/use-toast";

interface Props {
  platform: LovableProduct | null;
  isNew?: boolean;
  onClose: () => void;
}

export default function PlatformEditDialog({ platform, isNew, onClose }: Props) {
  const { addProduct, editProduct, clientIdsFor } = useLovableProducts();
  const { data: allClients = [] } = useAllClients();
  const { toast } = useToast();
  const open = !!platform || !!isNew;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url_app, setUrlApp] = useState("");
  const [links, setLinks] = useState<PlatformLink[]>([]);
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("ativo");
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    if (platform) {
      setNome(platform.nome);
      setDescricao(platform.descricao ?? "");
      setUrlApp(platform.url_app ?? "");
      setLinks(platform.links ?? []);
      setCategoria(platform.categoria ?? "");
      setStatus(platform.status || "ativo");
      setClientIds(clientIdsFor(platform.id));
    } else if (isNew) {
      setNome("");
      setDescricao("");
      setUrlApp("");
      setLinks([]);
      setCategoria("");
      setStatus("ativo");
      setClientIds([]);
    }
    setClientSearch("");
  }, [platform, isNew]);

  const isCreating = !platform && isNew;

  const consultoriaClients = allClients
    .filter((c) => c.product_id !== "trafego")
    .filter((c) => c.nome.toLowerCase().includes(clientSearch.trim().toLowerCase()));

  const toggleClient = (id: string) =>
    setClientIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saveBasic = async () => {
    if (!nome.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    if (isCreating) {
      addProduct.mutate(
        {
          values: {
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            categoria: categoria.trim() || null,
            status,
            url_app: url_app.trim() || null,
            thumbnail_url: null,
            video_demo_url: null,
            stack: [],
            cliente_origem_id: null,
            tags: [],
            links,
          },
          clientIds,
        },
        {
          onSuccess: () => {
            toast({ title: "Plataforma criada" });
            onClose();
          },
          onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
        }
      );
    } else if (platform) {
      editProduct.mutate(
        {
          id: platform.id,
          values: {
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            url_app: url_app.trim() || null,
            categoria: categoria.trim() || null,
            status,
            links,
          } as any,
          clientIds,
        },
        {
          onSuccess: () => toast({ title: "Plataforma atualizada" }),
          onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-card border-border max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Nova plataforma" : `Editar: ${platform?.nome}`}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="links" disabled={isCreating}>
              <Link2 size={13} className="mr-1.5" /> Links
            </TabsTrigger>
            <TabsTrigger value="files" disabled={isCreating}>
              <FileText size={13} className="mr-1.5" /> Arquivos
            </TabsTrigger>
            <TabsTrigger value="creds" disabled={isCreating}>
              <KeyRound size={13} className="mr-1.5" /> Acessos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-3 mt-4">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs">Descrição (pra que serve)</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs">URL do app</Label>
              <Input
                value={url_app}
                onChange={(e) => setUrlApp(e.target.value)}
                placeholder="https://..."
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Fiscal, Contábil..."
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md bg-secondary border border-border px-3 text-sm"
                >
                  <option value="ativo">Ativo</option>
                  <option value="prototipo">Protótipo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Clientes vinculados</Label>
              <Input
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="mt-1 bg-secondary border-border h-8 text-sm"
              />
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border">
                {consultoriaClients.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">Nenhum cliente encontrado.</p>
                ) : (
                  consultoriaClients.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-secondary/50"
                    >
                      <Checkbox
                        checked={clientIds.includes(c.id)}
                        onCheckedChange={() => toggleClient(c.id)}
                      />
                      <span className="truncate">{c.nome}</span>
                    </label>
                  ))
                )}
              </div>
              {clientIds.length > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {clientIds.length} cliente(s) selecionado(s)
                </p>
              )}
            </div>
            {isCreating && (
              <LinksEditor
                links={links}
                onChange={setLinks}
                hint="Você pode adicionar mais links após criar."
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button size="sm" onClick={saveBasic}>
                {isCreating ? "Criar" : "Salvar"}
              </Button>
            </div>
          </TabsContent>

          {platform && (
            <>
              <TabsContent value="links" className="mt-4">
                <LinksTab platform={platform} />
              </TabsContent>
              <TabsContent value="files" className="mt-4">
                <FilesTab platform={platform} />
              </TabsContent>
              <TabsContent value="creds" className="mt-4">
                <CredentialsTab platform={platform} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function LinksEditor({
  links,
  onChange,
  hint,
}: {
  links: PlatformLink[];
  onChange: (next: PlatformLink[]) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Links</Label>
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={l.label}
            placeholder="Rótulo"
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], label: e.target.value };
              onChange(next);
            }}
            className="bg-secondary border-border w-1/3"
          />
          <Input
            value={l.url}
            placeholder="https://..."
            onChange={(e) => {
              const next = [...links];
              next[i] = { ...next[i], url: e.target.value };
              onChange(next);
            }}
            className="bg-secondary border-border flex-1"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...links, { label: "", url: "" }])}
        className="gap-1.5"
      >
        <Plus size={13} /> Adicionar link
      </Button>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function LinksTab({ platform }: { platform: LovableProduct }) {
  const [links, setLinks] = useState<PlatformLink[]>(platform.links ?? []);
  const { updateLinks } = usePlatformMutations();
  const { toast } = useToast();

  useEffect(() => setLinks(platform.links ?? []), [platform.links]);

  return (
    <div className="space-y-3">
      <LinksEditor links={links} onChange={setLinks} />
      <div className="flex flex-wrap gap-1.5">
        {links
          .filter((l) => l.url)
          .map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {l.label || l.url} <ExternalLink size={11} />
            </a>
          ))}
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() =>
            updateLinks.mutate(
              { productId: platform.id, links: links.filter((l) => l.url.trim()) },
              { onSuccess: () => toast({ title: "Links salvos" }) }
            )
          }
        >
          Salvar links
        </Button>
      </div>
    </div>
  );
}

function FilesTab({ platform }: { platform: LovableProduct }) {
  const { data: files = [] } = usePlatformFiles(platform.id);
  const { uploadFile, deleteFile, downloadFile } = usePlatformMutations();
  const { toast } = useToast();

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || !list.length) return;
    Array.from(list).forEach((file) =>
      uploadFile.mutate(
        { productId: platform.id, file },
        { onError: (err: any) => toast({ title: "Falha no upload", description: err.message, variant: "destructive" }) }
      )
    );
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border text-xs cursor-pointer hover:bg-secondary/50">
        <Upload size={14} />
        Enviar arquivos
        <input type="file" multiple onChange={onUpload} className="hidden" />
      </label>

      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum arquivo enviado.</p>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <FileText size={14} className="text-muted-foreground" />
              <span className="flex-1 truncate">{f.nome}</span>
              <span className="text-[11px] text-muted-foreground">
                {f.size_bytes ? `${(f.size_bytes / 1024).toFixed(0)} KB` : ""}
              </span>
              <Button size="icon" variant="ghost" onClick={() => downloadFile(f)}>
                <Download size={14} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => deleteFile.mutate(f)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CredentialsTab({ platform }: { platform: LovableProduct }) {
  const { data: creds = [] } = usePlatformCredentials(platform.id);
  const { upsertCredential, deleteCredential } = usePlatformMutations();
  const { toast } = useToast();

  const [draft, setDraft] = useState<Partial<PlatformCredential>>({ label: "", usuario: "", senha: "", notas: "" });

  const addNew = () => {
    if (!draft.label?.trim()) {
      toast({ title: "Informe o rótulo", variant: "destructive" });
      return;
    }
    upsertCredential.mutate(
      { product_id: platform.id, label: draft.label!, usuario: draft.usuario, senha: draft.senha, notas: draft.notas },
      {
        onSuccess: () => {
          setDraft({ label: "", usuario: "", senha: "", notas: "" });
          toast({ title: "Acesso adicionado" });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {creds.map((c) => (
          <CredentialRow
            key={c.id}
            cred={c}
            onSave={(values) =>
              upsertCredential.mutate(
                { id: c.id, product_id: platform.id, ...values },
                { onSuccess: () => toast({ title: "Acesso atualizado" }) }
              )
            }
            onDelete={() => deleteCredential.mutate(c)}
          />
        ))}
      </div>

      <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Novo acesso</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Rótulo (ex.: Painel admin)"
            value={draft.label ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            className="bg-secondary border-border"
          />
          <Input
            placeholder="Usuário / e-mail"
            value={draft.usuario ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, usuario: e.target.value }))}
            className="bg-secondary border-border"
          />
          <Input
            placeholder="Senha"
            value={draft.senha ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, senha: e.target.value }))}
            className="bg-secondary border-border col-span-2"
          />
          <Textarea
            placeholder="Notas"
            rows={2}
            value={draft.notas ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notas: e.target.value }))}
            className="bg-secondary border-border col-span-2"
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={addNew} className="gap-1.5">
            <Plus size={13} /> Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}

function CredentialRow({
  cred,
  onSave,
  onDelete,
}: {
  cred: PlatformCredential;
  onSave: (values: { label: string; usuario: string | null; senha: string | null; notas: string | null }) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(cred.label);
  const [usuario, setUsuario] = useState(cred.usuario ?? "");
  const [senha, setSenha] = useState(cred.senha ?? "");
  const [notas, setNotas] = useState(cred.notas ?? "");
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound size={13} className="text-primary" />
          <p className="text-sm font-semibold flex-1">{cred.label}</p>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
        {cred.usuario && (
          <p className="text-xs">
            <span className="text-muted-foreground">Usuário: </span>
            <span className="font-mono">{cred.usuario}</span>
          </p>
        )}
        {cred.senha && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Senha:</span>
            <span className="font-mono">{show ? cred.senha : "••••••••"}</span>
            <button onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-foreground">
              {show ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(cred.senha!)}
              className="text-[10px] text-primary hover:underline"
            >
              copiar
            </button>
          </div>
        )}
        {cred.notas && <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">{cred.notas}</p>}
      </div>
    );
  }

  return (
    <div className="border border-primary/40 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-secondary border-border" />
        <Input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuário"
          className="bg-secondary border-border"
        />
        <Input
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          className="bg-secondary border-border col-span-2"
        />
        <Textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Notas"
          className="bg-secondary border-border col-span-2"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSave({
              label,
              usuario: usuario || null,
              senha: senha || null,
              notas: notas || null,
            });
            setEditing(false);
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}