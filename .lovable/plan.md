## Como alimentar o Fluxo de Caixa

Hoje o fluxo se alimenta de duas fontes:
1. **Receitas automáticas**: clientes ativos de HefSys, Consultoria Clix e Plataformas IA (lidas direto do cadastro do cliente).
2. **Despesas recorrentes**: tabela `cash_expenses` (já existe CRUD em Configurações).

Vou adicionar uma **terceira fonte: lançamentos avulsos** por mês/dia, cobrindo receitas extras, despesas pontuais, investimentos e movimentações de sócio — tudo isso já cabe na tabela `cash_overrides` que existe, só precisa de UI.

## O que muda

### 1. Novos tipos de lançamento

Expandir o enum de `tipo` em `cash_overrides` para:
- `receita` — entrada operacional avulsa (cliente extra, projeto pontual)
- `despesa` — saída operacional pontual
- `investimento` — saída de CAPEX (equipamento, software à vista)
- `aporte` — entrada de sócio (não é receita)
- `retirada` — saída de sócio (não é despesa operacional)

Os 5 tipos entram/saem do caixa normalmente, mas aparecem **agrupados separadamente** na tabela anual para você enxergar o que é operacional vs. capital.

### 2. Drill-down do mês vira o ponto de entrada

No painel diário (`CashFlowDayDetail`):
- Botão **"+ Lançamento"** no header → abre dialog (tipo, data dentro do mês, valor, descrição, categoria).
- Em cada dia do mini-calendário, ícone **"+"** ao passar o mouse → abre o mesmo dialog já com a data preenchida.
- Cada item da lista de transações ganha menu **⋯**:
  - Para lançamentos de cliente projetados → **"Ajustar este mês"** (cria override que substitui o valor do mês — ex: cliente vai pagar metade).
  - Para overrides/avulsos → **Editar** e **Excluir**.

### 3. Tabela anual reorganizada

Adicionar duas seções abaixo de Despesas:
- **Investimentos** (CAPEX) — expansível por item.
- **Movimentação de Sócios** — aportes e retiradas separados.

E o **Resultado** vira:
- *Resultado Operacional* = Receitas − Despesas
- *Resultado de Caixa* = Operacional − Investimentos + Aportes − Retiradas
- *Saldo Final* = saldo anterior + Resultado de Caixa

### 4. Override de receita de cliente

Quando você clicar "Ajustar este mês" num cliente projetado:
- Cria um `cash_overrides` com `origem_tipo='cliente'`, `origem_id=<id do cliente>`, `tipo='receita'`, `data` e `valor` que você definir.
- O projetor já está preparado: ele substitui o valor automático pelo override no mês correspondente.
- Valor `0` zera a entrada daquele mês (cliente não pagou); valor `X` substitui o valor projetado.

## Detalhes técnicos

### Migração

```sql
-- Permitir os novos tipos em cash_overrides (atualmente só receita/despesa)
ALTER TABLE cash_overrides
  ADD CONSTRAINT cash_overrides_tipo_check
  CHECK (tipo IN ('receita','despesa','investimento','aporte','retirada'));

-- Categorias padrão (texto livre + sugestões)
-- Nenhuma nova tabela; categorias permanecem como string em `categoria`.
```

### Arquivos a criar

- `src/components/CashEntryDialog.tsx` — dialog único para criar/editar qualquer tipo de lançamento (controla campos por tipo).
- `src/hooks/useCashOverrides.ts` — já existe; estender com helpers `createOverride`, `updateOverride`, `deleteOverride`.

### Arquivos a editar

- `src/hooks/useCashFlow.ts` — agrupar overrides nos 5 buckets (`receita`, `despesa`, `investimento`, `aporte`, `retirada`) e devolver no `MonthSummary`.
- `src/components/CashFlowDayDetail.tsx` — botão "+ Lançamento", "+" nos dias, menu ⋯ em cada item, integração com `CashEntryDialog`.
- `src/pages/CashFlowPage.tsx` — adicionar seções Investimentos e Sócios; reformular linha de Resultado.

### Fora de escopo (para depois, se quiser)

- Marcar lançamento como "pago/recebido" (realizado vs. previsto).
- Importação de extrato bancário.
- Cenários (otimista/realista) — fica para uma próxima.

## Resumo rápido

Você vai alimentar o fluxo de **três formas**:
1. Cadastrando cliente → vira receita projetada automática.
2. Configurações → Despesas recorrentes (já funciona).
3. **Novo:** clicando no mês ou dia → adiciona receita extra, despesa pontual, investimento, aporte ou retirada; e ajusta valor de cliente quando precisar.
