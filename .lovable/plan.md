## Biblioteca de Produtos Lovable

Nova aba global no menu lateral pra catalogar os apps Lovable que você cria, podendo vincular cada produto a múltiplos clientes (e cada cliente a múltiplos produtos), facilitando replicação.

### Banco (1 migration)

**`lovable_products`** — catálogo central
- `nome` (text, obrigatório)
- `descricao` (text)
- `categoria` (text) — ex.: CRM, Dashboard, Automação
- `status` (text) — `ativo` | `prototipo` | `arquivado` (default `ativo`)
- `url_app` (text) — link do projeto publicado
- `thumbnail_url` (text)
- `video_demo_url` (text)
- `stack` (text[]) — integrações/tecnologias
- `cliente_origem_id` (uuid) — cliente que originou (opcional)
- `tags` (text[])
- `created_by` (uuid), `created_at`, `updated_at`

**`lovable_product_clients`** — junção M:N
- `product_id` (uuid → lovable_products)
- `client_id` (uuid → clients)
- `data_replicacao` (date), `notas` (text)
- PK composta (product_id, client_id)

**RLS:** authenticated faz tudo (qualquer consultor cadastra/edita), service_role full. GRANTs explícitos.

### Frontend

**Sidebar** — novo item global "Produtos Lovable" (ícone `Package`), entre Materiais e CRM.

**Nova página `LovableProductsPage`**
- Grid de cards com thumbnail, nome, categoria, status badge, contagem de clientes que usam.
- Filtros: categoria, status, busca por nome/tag.
- Botão "Novo Produto" → dialog com todos os campos + multi-select de clientes vinculados.
- Click no card → drawer/dialog de detalhe: descrição completa, vídeo embed, stack chips, lista de clientes vinculados (com botão "Aplicar a outro cliente"), editar/excluir.

**Hook `useLovableProducts`** — CRUD via React Query + gerencia vínculos M:N.

**Página do cliente (`ClientDetailPage`)** — nova seção "Produtos Lovable" listando produtos vinculados, com botão pra adicionar/remover vínculo.

### Detalhes técnicos
- Padrão idêntico ao `useMaterials` / `MaterialsPage` pra manter consistência visual.
- Thumbnails via URL (sem upload de arquivo nesta versão — pode ser adicionado depois com Storage).
- Vídeo demo aceita YouTube/Loom (embed automático se URL reconhecida).
- Tudo segue tokens HSL do design system (dark, primary lime, fontes existentes).

### Fora do escopo
- Upload de arquivos (thumbnails ficam por URL).
- Versionamento de produtos.
- Métricas de uso.