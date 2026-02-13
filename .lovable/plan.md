
# Plano: Produtos Dinamicos + Automacao IA + Plataformas IA

## 1. Produtos Dinamicos (Banco de Dados)

Atualmente os produtos estao hardcoded em `constants.ts`. Para permitir criar novos produtos pelo sistema:

### Nova tabela `products`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | text (PK) | Slug unico (ex: "hefsys", "trafego") |
| nome | text | Nome de exibicao |
| descricao | text | Descricao curta |
| icon | text | Nome do icone Lucide (ex: "Calculator") |
| position | integer | Ordem na sidebar |
| created_at | timestamptz | Auto |
| config | jsonb | Configuracoes especificas do produto (campos extras, etc.) |

- Migrar os 4 produtos atuais como seed data
- RLS: leitura para todos autenticados, escrita apenas admin
- O tipo `ProductId` deixa de ser um union fixo e passa a ser `string`
- Sidebar e seletor de produto passam a ler da tabela via hook `useProducts()`
- Admin tera um botao "Novo Produto" no seletor de produtos para criar novos

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/data/constants.ts` | `ProductId` vira `string`, remove array `PRODUCTS` hardcoded |
| `src/hooks/useProducts.ts` | Novo hook: CRUD de produtos via React Query |
| `src/components/Sidebar.tsx` | Ler produtos do hook ao inves de constante |
| `src/pages/Index.tsx` | Usar `useProducts()` para lista de produtos |
| `src/pages/DashboardPage.tsx` | Adaptar para productId generico |
| Todos os dialogs | Usar `productId` como string |

---

## 2. Automacao IA - Timeline de Onboarding

Para clientes de automacao, adicionar um sistema de etapas de ciclo de vida com datas calculadas automaticamente a partir de uma "data de go-live":

### Novos campos na tabela `clients`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| data_golive | date | Data de inicio do go-live |
| notas_automacao | text | Campo de texto livre para regras e entregaveis |

### Etapas do ciclo (calculadas automaticamente)

As etapas sao fixas no codigo, mas as datas sao calculadas a partir de `data_golive`:

1. **Onboarding** — Kick-off/Discovery + Parametrizacao (antes do go-live)
2. **Teste e Acompanhamento** — Dia 1 ao 7 apos go-live
3. **Revisao 1** — 15 a 30 dias apos go-live
4. **Revisao 2** — 60 dias apos go-live
5. **Revisao 3** — 90 dias apos go-live
6. **Revisao 4** — 120 dias / Semestral
7. **Notas Importantes** — Regras e entregaveis (texto livre)

### Exibicao

- **ClientDetailPage**: Timeline visual vertical mostrando cada etapa com status (pendente/atual/concluido) baseado na data atual vs data calculada
- **CalendarPage**: Eventos de revisao aparecem no calendario com cor especifica
- **AddClientDialog/EditClientDialog**: Quando `product_id === "automacao"`, mostrar campo de data do go-live e notas

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/data/constants.ts` | Adicionar campos `dataGoLive` e `notasAutomacao` em `GenericClient` |
| `src/hooks/useClients.ts` | Mapear novos campos |
| `src/components/AddClientDialog.tsx` | Campos para automacao (data go-live, notas) |
| `src/components/EditClientDialog.tsx` | Campos para automacao |
| `src/pages/ClientDetailPage.tsx` | Timeline visual de etapas |
| `src/pages/CalendarPage.tsx` | Eventos de revisao no calendario |

---

## 3. Plataformas IA - Campos extras

### Novos campos na tabela `clients`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| nome_plataforma | text | Nome da plataforma desenvolvida |
| tipo_plataforma | text | "interna" ou "externa" (cliente) |

### Exibicao

- **AddClientDialog/EditClientDialog**: Quando `product_id === "plataformas"`, mostrar campos de nome da plataforma e select interna/externa
- **ClientDetailPage**: Exibir nome da plataforma e tipo
- **ClientsPage**: Mostrar plataforma e tipo na listagem

---

## Detalhes Tecnicos

### Migracao SQL

```text
-- Tabela de produtos dinamicos
CREATE TABLE public.products (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Box',
  position integer NOT NULL DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed dos 4 produtos atuais
INSERT INTO public.products (id, nome, descricao, icon, position) VALUES
  ('hefsys', 'HefSys', 'Contabilidade', 'Calculator', 0),
  ('trafego', 'Tráfego Pago', 'Marketing Digital', 'Megaphone', 1),
  ('automacao', 'Automação IA', 'Automações', 'Bot', 2),
  ('plataformas', 'Plataformas IA', 'Desenvolvimento', 'MonitorSmartphone', 3);

-- Novos campos para automacao e plataformas
ALTER TABLE clients ADD COLUMN data_golive date DEFAULT NULL;
ALTER TABLE clients ADD COLUMN notas_automacao text DEFAULT NULL;
ALTER TABLE clients ADD COLUMN nome_plataforma text DEFAULT NULL;
ALTER TABLE clients ADD COLUMN tipo_plataforma text DEFAULT NULL;
```

### Hook useProducts

```text
- Fetch todos os produtos ordenados por position
- Mutation para criar novo produto (admin only)
- Mutation para editar produto
- Mutation para deletar produto
```

### Mapeamento de icones dinamicos

Os icones serao armazenados como string (ex: "Calculator") e mapeados em runtime usando um dicionario de icones do Lucide disponiveis.

### Ordem de implementacao

1. Migracao SQL (tabela products + novos campos em clients)
2. Hook useProducts + adaptar constants.ts
3. Sidebar e seletor de produtos dinamico + botao "Novo Produto"
4. Campos de automacao (formularios + timeline + calendario)
5. Campos de plataformas (formularios + detail page)
6. Adaptar todos os componentes que usam ProductId como union type
