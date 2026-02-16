

# Dashboard Admin: Status de Checklists + Painel Financeiro Geral

## 1. Painel de Status dos Checklists (admin only, HefSys)

Quando o admin estiver no Dashboard do HefSys, um novo card sera exibido mostrando o status dos checklists do dia atual para cada cliente ativo:

- Para cada cliente HefSys ativo, buscar o checklist do dia de hoje (se houver execucao agendada)
- Mostrar uma lista com:
  - Nome do cliente
  - Barra de progresso (X de Y steps completos)
  - Nome do usuario que fez os checks e horario
  - Indicador visual: verde (completo), amarelo (parcial), vermelho (nenhum check feito)
- Se nao houver execucao agendada para hoje, mostrar "Sem execucao hoje"

### Dados necessarios

- Query direta em `client_checklists` filtrada por `periodo = hoje` para todos os clientes HefSys ativos
- Cruzar com `checklist_steps` para saber o total de passos esperados
- Extrair `username` e `at` dos steps com `StepInfo`

### Novo hook

**`src/hooks/useTodayChecklists.ts`** — Busca todos os checklists do dia atual para uma lista de clientes, retornando status consolidado (completo/parcial/pendente) com info de quem fez.

## 2. Painel Financeiro Geral (admin only, todos os produtos)

Acima do dashboard especifico do produto, quando o admin estiver logado, exibir um painel consolidado com:

- Um card por produto mostrando:
  - Nome do produto (com icone)
  - Quantidade de clientes ativos
  - Receita mensal total (faturamento para HefSys, valorContrato para os demais)
- Card de totalizacao geral:
  - Total de clientes ativos (todos os produtos)
  - Receita mensal total consolidada

### Dados necessarios

- Query em `clients` agrupada por `product_id`, somando financeiro por produto
- Usar os `products` ja carregados via `useProducts()`

### Novo hook

**`src/hooks/useFinancialOverview.ts`** — Busca todos os clientes ativos de todos os produtos e calcula metricas financeiras agrupadas.

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useTodayChecklists.ts` | **Novo** — Hook para buscar status de checklists do dia |
| `src/hooks/useFinancialOverview.ts` | **Novo** — Hook para metricas financeiras cross-product |
| `src/pages/DashboardPage.tsx` | Adicionar painel financeiro geral (admin) + card de status dos checklists (admin, HefSys) |
| `src/pages/Index.tsx` | Passar `products` como prop para DashboardPage |

## Detalhes Tecnicos

### useTodayChecklists

```text
- Recebe lista de client IDs e tipos (certidoes/caixas_postais)
- Calcula a data de hoje como "YYYY-MM-DD"
- Busca em client_checklists WHERE periodo = hoje AND client_id IN (...)
- Cruza com checklist_steps para saber total esperado
- Retorna por cliente: { clientId, totalSteps, doneSteps, users: [{username, at}], status: "completo"|"parcial"|"pendente"|"sem_execucao" }
```

### useFinancialOverview

```text
- Busca todos os clientes ativos (status = 'ativo') sem filtro de product_id
- Agrupa por product_id
- Para cada grupo: count de clientes + soma de faturamento (hefsys) ou valor_contrato (demais)
- Retorna array de { productId, clientCount, totalRevenue }
```

### Layout do Dashboard atualizado

```text
+-----------------------------------------------------+
| [PAINEL FINANCEIRO GERAL - admin only]               |
| ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ |
| | HefSys   | | Trafego  | | Automacao| | TOTAL    | |
| | 5 ativos | | 3 ativos | | 2 ativos | | 10 ativos| |
| | R$ 8.500 | | R$ 4.200 | | R$ 3.000 | | R$15.700 | |
| └──────────┘ └──────────┘ └──────────┘ └──────────┘ |
+-----------------------------------------------------+
| [DASHBOARD DO PRODUTO SELECIONADO - existente]       |
| StatCards...                                         |
| ...                                                  |
+-----------------------------------------------------+
| [STATUS CHECKLISTS HOJE - admin only, HefSys]        |
| ┌──────────────────────────────────────────────────┐ |
| | Cliente A  ████████░░ 8/10  João · 14:32         | |
| | Cliente B  ██████████ 10/10 Maria · 09:15   OK   | |
| | Cliente C  ░░░░░░░░░░ 0/10  Pendente        !!   | |
| | Cliente D  — Sem execução hoje                    | |
| └──────────────────────────────────────────────────┘ |
+-----------------------------------------------------+
```

