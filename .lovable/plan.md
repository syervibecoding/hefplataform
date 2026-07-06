## Objetivo

Adicionar, no cadastro de clientes de **Consultoria** (`consultoria-clix`), campos de **% de comissão** e **nome do comercial**. Enquanto o cliente estiver ativo, uma **despesa mensal automática** = `valor_contrato × %` entra no Fluxo de Caixa, congelando no histórico como as demais entradas.

## Escopo e regras

- Campos aparecem só quando o produto ativo for `consultoria-clix` (no Add e no Edit).
- Comissão só é gerada se `status = ativo`, `comissao_percentual > 0` e o mês for igual/posterior ao `data_inicio` do cliente.
- Data da despesa no mês = mesmo `dia_pagamento` do cliente.
- Meses passados congelam via `cash_month_snapshots` (mesmo mecanismo já existente).
- Se o cliente for desativado, deixa de gerar comissão dos meses futuros (histórico congelado permanece).

## Alterações

### 1. Banco (`clients`)
Nova migração adicionando duas colunas:
- `comissao_percentual numeric NOT NULL DEFAULT 0`
- `comissao_comercial text`

### 2. Formulários
`src/components/AddClientDialog.tsx` e `src/components/EditClientDialog.tsx`:
- Estender o `genericSchema` com `comissaoPercentual` (0–100) e `comissaoComercial` (texto opcional).
- Renderizar bloco "Comissão comercial" **somente quando `activeProduct === "consultoria-clix"`**, com dois inputs (% e nome).
- Passar os novos campos para `onAddClient` / `onEditClient`.

### 3. Persistência
`src/hooks/useClients.ts`: mapear os novos campos entre camelCase (front) e snake_case (banco) nos métodos de create/update.

### 4. Fluxo de Caixa
`src/hooks/useCashFlow.ts`:
- No SELECT de clientes, incluir `comissao_percentual, comissao_comercial`.
- Dentro do bloco `consultoria-clix` de `projectClientEntries`, além da receita, projetar uma segunda entrada do tipo `despesa` quando `comissao_percentual > 0`:
  - `valor = valor_contrato × comissao_percentual / 100`
  - `nome = "Comissão {comercial|"—"} · {cliente}"`
  - `categoria = "comissoes"`
  - `sub_kind = "comissao"` (nova chave de snapshot, independente do "default")
  - Segue o mesmo `pushWithSnapshot` para congelar meses passados.

### 5. Congelar histórico
`src/lib/freezeClientHistory.ts`: incluir também a projeção de snapshots com `sub_kind = "comissao"` para clientes `consultoria-clix` que já tenham % configurado, usando a mesma regra (dia_pagamento, valor = contrato × %).

## Detalhes técnicos

```text
consultoria-clix cliente ativo, comissao_percentual > 0
  ├─ receita mensal  (sub_kind "default")     — já existe
  └─ despesa mensal  (sub_kind "comissao")    — NOVO
       valor = valor_contrato * comissao_percentual / 100
       data  = dia_pagamento do cliente
       nome  = "Comissão {comercial} · {nome_cliente}"
       past? → grava/lê cash_month_snapshots
```

Não altera outros produtos, não muda o cálculo de receita nem mexe em despesas cadastradas manualmente.

## Fora de escopo

- Comissão sobre implementação/mensalidade de plataformas.
- Cadastro estruturado de comerciais (uma tabela própria) — por ora texto livre.
- Data de fim de contrato (usuário optou por "indeterminado até desativar").