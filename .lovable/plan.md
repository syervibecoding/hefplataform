## Objetivo

Criar um módulo **Fluxo de Caixa** (admin-only) que projete entradas (a partir dos clientes ativos) e saídas (despesas cadastradas) para qualquer mês/ano, mostrando totais por categoria, resultado operacional e saldo acumulado — com possibilidade de abrir um dia específico e ver cada lançamento.

---

## 1. Mudanças no banco

### 1.1. Clientes — novo campo
- `clients.dia_pagamento` (int 1–31, default `5`). Usado para projetar a entrada mensal.
- Para **Plataformas**: a parcela única usa `data_implementacao`; a recorrente (se `tem_mensalidade=true`) usa `dia_pagamento` nos meses seguintes ao da implementação.

### 1.2. Nova tabela `cash_expenses` (despesas recorrentes/avulsas)
Campos:
- `nome` (texto)
- `categoria` (enum: `pessoal`, `infraestrutura`, `software`, `marketing`, `educacao`, `administrativo`, `impostos`, `outros`)
- `valor` (numérico)
- `dia_pagamento` (int 1–31; ex.: salários = último dia útil → representado como `31` + flag `ultimo_dia_util`)
- `ultimo_dia_util` (bool, default false)
- `recorrencia` (enum: `mensal`, `unica`)
- `data_inicio` (date) e `data_fim` (date, nullable) — define o intervalo em que a despesa aparece
- `ativo` (bool)

RLS: somente admin lê/escreve.

### 1.3. Nova tabela `cash_overrides` (exceções pontuais)
Permite editar/zerar/adicionar um lançamento em um mês específico sem mexer na recorrência.
- `tipo` (`receita` | `despesa`)
- `origem_id` (uuid do cliente OU da despesa; nullable se for lançamento manual avulso)
- `nome` (texto livre — usado quando não há `origem_id`)
- `categoria` (texto — só para despesas avulsas)
- `data` (date, dia exato)
- `valor` (numérico; pode ser zero para "cancelar" aquele mês)

RLS: somente admin.

### 1.4. Nova tabela `cash_settings`
- `saldo_inicial` (numérico)
- `data_saldo_inicial` (date) — a partir de quando esse saldo vale

RLS: somente admin.

---

## 2. Lógica de projeção (frontend, em hook React Query)

`useCashFlow(year, month)` devolve, para cada dia do mês:
- lista de **entradas** (cliente + valor) calculadas assim:
  - HefSys / Tráfego Pago / Automação IA → `valor_contrato` (ou `faturamento` no caso HefSys) no `dia_pagamento`.
  - Plataformas → `valor_implementacao` no dia exato de `data_implementacao` (apenas naquele mês) + `valor_mensalidade` no `dia_pagamento` nos meses seguintes, se `tem_mensalidade`.
- lista de **saídas** (despesa + valor) a partir de `cash_expenses` ativas cuja `data_inicio ≤ mês ≤ data_fim`; quando `ultimo_dia_util=true`, projeta no último dia útil do mês.
- aplica `cash_overrides` por (`origem_id`, mês) — substitui valor, zera ou adiciona avulsos.

`useCashFlowYear(year)` agrega isso por mês para a tabela anual.

---

## 3. UI

### 3.1. Nova entrada no Sidebar
- Item **"Fluxo de Caixa"** dentro da área Admin, ao lado de "Dashboard Geral". Ícone `Wallet` ou `LineChart`. Bloqueado por `isAdmin`.

### 3.2. Página principal — Visão Mensal/Anual (estilo planilha)
Tabela inspirada na planilha enviada:

```
                       Jan  Fev  Mar  ...  Dez   Total
RECEITAS
  AGR consultas         …    …    …
  Union                 …
  (cada cliente)        …
  TOTAL RECEITAS        …
  Receita acumulada     …

DESPESAS
  Pessoal               …
  Infraestrutura        …
  Software & Tecnol.    …
  Administrativo/Imp.   …
  TOTAL DESPESAS        …

RESULTADO OPERACIONAL   …
SALDO FINAL DE CAIXA    …
```

- Seletor de ano no topo.
- Linhas de receita agrupadas por produto (colapsável) listando cada cliente.
- Despesas agrupadas por categoria (colapsável).
- Coluna de cada mês é clicável → abre o drill-down diário.

### 3.3. Drill-down diário
Modal/painel lateral mostrando:
- Cabeçalho: nome do mês + ano, totais (Receita, Despesa, Resultado, Saldo final).
- **Mini-calendário** do mês colorindo cada dia conforme saldo do dia (verde/recebimento, vermelho/pagamento, neutro).
- Ao selecionar um dia: lista de entradas e saídas daquele dia, com nome, categoria/produto, valor.
- Botão "Adicionar lançamento avulso" (cria `cash_override` sem `origem_id`).
- Em cada linha de override existente: editar/excluir.

### 3.4. Página de Configurações do Fluxo
Acessível por um botão "Configurações" no topo do módulo:
- Campo de Saldo Inicial + data de referência.
- CRUD de **Despesas** (modal com nome, categoria, valor, dia de pagamento OU "último dia útil", recorrência, data início/fim, ativo).

### 3.5. Cadastro de cliente
- Adicionar campo "Dia de pagamento (1–31)" em `AddClientDialog` e `EditClientDialog`, ao lado dos campos financeiros.

---

## 4. Import inicial das despesas de 2026

Após a migração e cadastro do campo `dia_pagamento` dos clientes, popular `cash_expenses` com as linhas da planilha (Salário Billy 1.518, Salário Pedro 450 a partir de Jun, Salários Sócios 1.600→2.600, Lovable 550, GPT 120, Hostinger 72,59, API 1.300, Impostos variável por mês — esse vira `cash_overrides` por mês, Despesas Administrativas idem).

Item separado para Impostos/Adm: como variam mês a mês, serão criados como **despesa mensal com valor=0** + um `cash_override` por mês com o valor real da planilha.

---

## 5. Segurança e permissões

- Tudo do módulo (rota, sidebar, hooks, RLS das três tabelas novas) gated por `has_role(uid, 'admin')`. Coordenador e usuário comum continuam sem qualquer acesso a dados financeiros.

---

## 6. Arquivos previstos

**Novos**
- `supabase/migrations/<ts>_cash_flow.sql` (campo `dia_pagamento`, tabelas `cash_expenses`, `cash_overrides`, `cash_settings`, RLS)
- `src/hooks/useCashFlow.ts`, `src/hooks/useCashExpenses.ts`, `src/hooks/useCashSettings.ts`, `src/hooks/useCashOverrides.ts`
- `src/pages/CashFlowPage.tsx` (visão mensal/anual)
- `src/components/CashFlowDayDetail.tsx` (drill-down diário)
- `src/components/CashFlowSettingsDialog.tsx` (saldo + CRUD despesas)
- `src/components/CashExpenseDialog.tsx`

**Editados**
- `src/components/Sidebar.tsx` (novo item)
- `src/pages/Index.tsx` (rota `cash-flow`)
- `src/components/AddClientDialog.tsx`, `src/components/EditClientDialog.tsx`, `src/hooks/useClients.ts`, `src/data/constants.ts` (campo `diaPagamento`)

---

## 7. Fora de escopo desta entrega

- Reconciliação com extrato bancário real.
- Exportação para Excel/PDF (pode entrar em uma próxima iteração).
- Múltiplas contas/empresas (tudo agregado em um único caixa).
- Marcar lançamentos como "pago/recebido" (a planilha é projeção; trataríamos baixas em iteração futura, se quiser).
