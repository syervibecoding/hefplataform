import { Package, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLovableProducts } from "@/hooks/useLovableProducts";

interface Props {
  clientId: string;
}

export default function CompanyProductsSection({ clientId }: Props) {
  const { products, links } = useLovableProducts();
  const productIds = new Set(links.filter((l) => l.client_id === clientId).map((l) => l.product_id));
  const owned = products.filter((p) => productIds.has(p.id));

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package size={16} className="text-primary" />
        <h3 className="text-sm font-bold">Produtos da empresa</h3>
        <Badge variant="secondary" className="text-[10px] ml-1">{owned.length}</Badge>
      </div>
      {owned.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum produto vinculado a esta empresa.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {owned.map((p) => (
            <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30">
              {p.thumbnail_url ? (
                <img src={p.thumbnail_url} alt={p.nome} className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                  <Package size={18} className="text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{p.nome}</p>
                  {p.url_app && (
                    <a href={p.url_app} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {p.categoria && <Badge variant="outline" className="text-[10px] mt-1">{p.categoria}</Badge>}
                {p.descricao && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.descricao}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}