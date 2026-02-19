
# Materiais + CRM de Prospecção

Duas novas funcionalidades independentes, bem integradas à estrutura atual do sistema.

---

## 1. Aba de Materiais

Uma biblioteca central de links e vídeos organizados por produto ou tema. Qualquer membro da equipe pode acessar; admins podem adicionar, editar e excluir materiais.

### Nova tabela `materials`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK) | Auto |
| titulo | text | Nome/título do material |
| descricao | text | Descrição opcional |
| tipo | text | `"link"` ou `"video"` |
| url | text | URL do link ou vídeo (YouTube, Loom, etc.) |
| product_id | text | Produto relacionado (ou `null` = geral) |
| categoria | text | Tag livre (ex: "Tutorial", "Processo", "Template") |
| created_by | uuid | Referência ao user_id de quem criou |
| created_at | timestamptz | Auto |

**RLS:**
- Leitura: todos autenticados
- Escrita (INSERT/UPDATE/DELETE): apenas admins

### Comportamento

- **Sidebar**: novo item "Materiais" no menu de navegação (ícone `BookOpen`)
- **Página `MaterialsPage`**:
  - Grid de cards com título, descrição, tipo (badge Link/Vídeo), produto relacionado e botão de acesso
  - Vídeos do YouTube/Loom exibem thumbnail automaticamente a partir da URL
  - Filtro por produto e por categoria (tabs ou pills)
  - Botão "Adicionar Material" (admin only)
  - Dialog para adicionar/editar: título, descrição, tipo, URL, produto, categoria

---

## 2. CRM de Prospecção

Painel para rastrear leads e prospects dos produtos do hub, separado dos clientes ativos. Permite acompanhar em qual etapa do funil cada prospect se encontra.

### Nova tabela `prospects`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid (PK) | Auto |
| nome | text | Nome do prospect/empresa |
| contato | text | Nome do responsável |
| whatsapp | text | Contato |
| email | text | Email |
| product_id | text | Produto de interesse |
| status | text | Etapa do funil (ver abaixo) |
| origem | text | Como chegou (Indicação, Instagram, etc.) |
| valor_estimado | numeric | Valor estimado do contrato |
| notas | text | Anotações livres |
| data_contato | date | Data do primeiro contato |
| data_followup | date | Data do próximo follow-up |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

**Etapas do funil (status):**
1. `novo_lead` — Lead identificado
2. `contato_feito` — Primeiro contato realizado
3. `reuniao_agendada` — Reunião marcada
4. `proposta_enviada` — Proposta enviada
5. `negociacao` — Em negociação
6. `ganho` — Convertido (vira cliente ativo)
7. `perdido` — Perdido/desistiu

**RLS:** Todos autenticados podem ler e escrever.

### Comportamento

- **Sidebar**: novo item "CRM" no menu de navegação (ícone `TrendingUp`)
- **Página `CRMPage`**:
  - Visão em **Kanban** — colunas por etapa do funil, cards arrastáveis para mover entre etapas
  - Visão em **tabela** — listagem com filtro por produto
  - Header com mini-métricas: total de prospects, valor potencial do pipeline
  - Ao clicar em um card/linha: drawer lateral com detalhes completos e histórico de anotações
  - Botão "Adicionar Prospect" com form: nome, contato, produto, origem, valor estimado, notas, datas

---

## Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/...` | **Nova** — Tabelas `materials` e `prospects` com RLS |
| `src/pages/MaterialsPage.tsx` | **Novo** — Página de materiais |
| `src/pages/CRMPage.tsx` | **Novo** — Página de CRM com kanban + tabela |
| `src/components/Sidebar.tsx` | Adicionar itens "Materiais" e "CRM" ao menu |
| `src/pages/Index.tsx` | Rotas para as novas páginas |
| `src/hooks/useMaterials.ts` | **Novo** — Hook CRUD de materiais |
| `src/hooks/useProspects.ts` | **Novo** — Hook CRUD de prospects |

---

## Detalhes Técnicos

### Ordem de implementação

1. Migração SQL (`materials` + `prospects` + RLS)
2. Hooks `useMaterials` e `useProspects` com React Query
3. Página de Materiais com grid, filtros e dialog de adição (admin)
4. Página de CRM com visão kanban (colunas por status) + tabela
5. Integrar rotas e sidebar

### Kanban do CRM

O kanban será implementado com CSS/Tailwind (sem biblioteca externa de drag-and-drop), usando o evento `onDragStart` / `onDrop` nativo do HTML5 para mover cards entre colunas — simples e sem dependências novas.

### Vídeos (Thumbnail automática)

Para URLs do YouTube (`youtube.com/watch?v=ID` ou `youtu.be/ID`), a thumbnail é extraída automaticamente via `https://img.youtube.com/vi/{ID}/mqdefault.jpg`. Para outros links, exibir ícone de link genérico.
