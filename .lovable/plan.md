# Plano: Modelo Plataformas (impl. única + mensalidade opcional) + Dashboard Geral

## 1. Modelo de dados — Plataformas

### 1.1 Migration (novas colunas em `clients`)

```sql
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS valor_implementacao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_implementacao date,
  ADD COLUMN IF NOT EXISTS tem_mensalidade boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_mensalidade numeric DEFAULT 0;
```

`valor_contrato` é mantido (usado por outros produtos como Tráfego e Automação). Para clientes de Plataformas, ele deixa de ser preenchido — passa a usar `valor_implementacao` + `valor_mensalidade`.

### 1.2 Tipos (`src/data/constants.ts`)

Em `GenericClient`, adicionar campos opcionais:
```ts
valorImplementacao?: number;
dataImplementacao?: string | null;
temMensalidade?: boolean;
valorMensalidade?: number;
```

### 1.3 Hook `useClients.ts`

- `mapRowToClient`: ler as 4 novas colunas
- `addClient`/`editClient`: quando `productId === "plataformas"`, gravar `valor_implementacao`, `data_implementacao`, `tem_mensalidade`, `valor_mensalidade` (e não escrever `valor_contrato`)

---

## 2. Formulários — AddClientDialog e EditClientDialog

Para Plataformas (substituindo o atual campo "Valor do Contrato"):

- **Valor da Implementação (R$)** — number, obrigatório
- **Data da Implementação** — date
- **Nome da Plataforma** — (já existe)
- **Tipo** — interna/externa (já existe)
- **Toggle "Tem mensalidade recorrente?"** — Switch
  - Se ativado, mostra: **Valor Mensal (R$)**

Schema zod para Plataformas separado dos demais produtos genéricos.

---

## 3. Cálculo financeiro — Plataformas

Para Plataformas, a "receita do mês atual" considera:
- **Valor da implementação**: conta apenas se `data_implementacao` cair no mês corrente
- **Valor mensal**: conta se `tem_mensalidade = true` E `data_implementacao <= último dia do mês corrente`

### 3.1 `useFinancialOverview.ts`

Atualizar para selecionar também as novas colunas e computar receita de Plataformas pela regra acima. Outros produtos continuam usando `valor_contrato`; HefSys continua usando `faturamento`.

### 3.2 Tela de detalhes do cliente (`ClientDetailPage.tsx`) e listagem (`ClientsPage.tsx`)

Para Plataformas, exibir:
- Valor Implementação, Data Implementação, e (se mensalidade) Valor Mensal
- Não exibir mais "Valor do Contrato"

---

## 4. Dashboard Geral (nova página)

### 4.1 Sidebar

Adicionar **antes** do seletor de produto, no topo:
```
[Dashboard Geral]  ← novo item destacado
─────────────────
[Seletor de produto]
[Menu do produto: Dashboard, Clientes, ...]
```

Quando clicado, navega para `general-dashboard` e desativa a navegação por produto (mostra um indicador "Visão Geral").

Sidebar exige `isAdmin` para mostrar o item (vê dados financeiros consolidados).

### 4.2 Nova página `src/pages/GeneralDashboardPage.tsx`

Conteúdo (admin-only):

1. **KPIs consolidados** (4 cards):
   - Total de clientes ativos (todos os produtos)
   - Receita mensal total (soma de todos os produtos com regra de Plataformas)
   - Total de produtos cadastrados
   - Total de melhorias em desenvolvimento

2. **Visão Financeira por Produto** — reutiliza o componente `FinancialOverview` já existente

3. **Clientes por Produto** — grid com uma coluna por produto, listando os clientes ativos (nome, contato, receita individual)

4. **Implementações de Plataformas este mês** — bloco específico listando clientes de Plataformas com `data_implementacao` no mês corrente

### 4.3 Roteamento (`src/pages/Index.tsx`)

- Adicionar case `"general-dashboard"` em `renderPage`
- Carregar `useAllClients` (já existe) ou criar hook agregador para puxar clientes de todos os produtos de uma vez
- Topbar mostra "Dashboard Geral" quando ativo

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| Nova migration | 4 novas colunas em `clients` |
| `src/data/constants.ts` | Novos campos em `GenericClient` |
| `src/hooks/useClients.ts` | Mapear/gravar novas colunas para Plataformas |
| `src/hooks/useFinancialOverview.ts` | Regra de receita de Plataformas (impl. + mensalidade) |
| `src/components/AddClientDialog.tsx` | Form Plataformas com novos campos + toggle |
| `src/components/EditClientDialog.tsx` | Form Plataformas idem |
| `src/pages/ClientsPage.tsx` | Colunas e exibição para Plataformas |
| `src/pages/ClientDetailPage.tsx` | Painel de detalhes para Plataformas |
| `src/pages/GeneralDashboardPage.tsx` | **Novo** — Dashboard Geral consolidado |
| `src/pages/Index.tsx` | Roteamento da nova página |
| `src/components/Sidebar.tsx` | Item "Dashboard Geral" no topo (admin) |
