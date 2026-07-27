## Objetivo
Fazer o Dashboard Geral refletir a realidade financeira do mês em curso, usando o que está lançado no Fluxo de Caixa em vez de recalcular por cliente.

## Mudanças

### 1. Faturamento Bruto do mês (card + KPIs de resultado)
- Trocar a base de cálculo `totalRevenue` (hoje `activeClients.reduce(revenueFor)`) por: **soma das entradas de receita do mês atual no Fluxo de Caixa** — `cashFlow.months[now.getMonth()].receitas`.
- Isso já respeita snapshots de meses passados, projeções vivas do mês atual e overrides.
- Card "Faturamento Bruto" passa a mostrar esse valor e ganha sub-texto "receitas do mês (fluxo)".

### 2. Impostos — puxar DAS real do fluxo, com fallback
- Novo cálculo de `impostos` no mês atual:
  - Somar `monthData.byCategoryDespesa["impostos"]` (categoria já usada em `cash_expenses`/`overrides`).
  - Se `> 0` → usar esse valor real; sub-texto: "DAS lançado no fluxo".
  - Se `= 0` → fallback ao cálculo atual `totalRevenue × alíquota%`; sub-texto: "estimado · sem DAS lançado".
- Como a despesa de imposto já compõe `totalDespesasMes`, subtrair ela do bloco de despesas para não duplicar no cálculo de resultado:
  - `despesasSemImpostos = totalDespesasMes − impostoLancadoNoFluxo`
  - `resultado = faturamentoLiquido − despesasSemImpostos`
- Card "Despesas do Mês" continua mostrando o total bruto (comportamento inalterado).

### 3. Previsão Anual (tabela mês a mês)
- Aplicar a mesma regra por mês: se houver despesa `impostos` lançada naquele mês, usar como imposto real; caso contrário, usar alíquota vigente × receita.
- Ajustar `desp` do mês para não contar a categoria `impostos` duas vezes.
- Total anual recalculado a partir dos meses.

### 4. Sem mudanças de banco
Nenhuma migração necessária — a categoria `impostos` já existe no schema de `cash_expenses`/`cash_overrides`.

## Arquivos afetados
- `src/pages/GeneralDashboardPage.tsx` — única alteração.

## Detalhes técnicos
- `useFinancialOverview` continua servindo os cards por produto (breakdown por produto abaixo dos KPIs), pois ali faz sentido mostrar o MRR por linha de negócio. Só o card consolidado "Faturamento Bruto" e os KPIs derivados mudam de fonte.
- Chave da categoria de imposto: `"impostos"` (mesma string usada em `categoryLabel` e nos selects de despesa).
