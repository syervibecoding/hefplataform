## Problema
1. O card "Faturamento Bruto" ainda mostra `totalRevenue` (soma do MRR dos clientes via `revenueFor`), não `faturamentoBrutoMes` (receitas do mês no fluxo). Por isso não reflete Julho — mostra o MRR "atualizado" independente do mês.
2. Não há como navegar entre meses para ver a previsão de meses futuros/passados nos KPIs.

## Mudanças (`src/pages/GeneralDashboardPage.tsx`)

### 1. Trocar fonte do card "Faturamento Bruto"
- Usar `faturamentoBrutoMes` (já calculado a partir de `monthData.receitas`) no card, com sub-texto "receitas do mês (fluxo)".
- Manter `totalRevenue` (MRR) apenas para o breakdown por produto, se necessário.

### 2. Navegação de mês nos KPIs do mês
- Adicionar estado `selectedMonth` (0-11) iniciando em `now.getMonth()` e `selectedYear` iniciando em `now.getFullYear()`.
- Botões ‹ / › ao lado do título da seção de KPIs, com label "mês/ano" (ex.: "Julho de 2026") e botão "Hoje" quando fora do mês corrente.
- Recalcular tudo que hoje usa `now.getMonth()` a partir do mês selecionado:
  - `monthData = cashFlow?.months[selectedMonth]` (quando `selectedYear === cashFlow.year`)
  - `currentMonthRate`, `impostoLancado`, `impostos`, `faturamentoLiquido`, `despesasSemImpostos`, `resultado`, `margem`, `despesasByCat`, `categoriasOrdenadas`, `plataformasMes`.
- Se `selectedYear` diferir do ano do `cashFlow` carregado, buscar via `useCashFlowYear(selectedYear, isAdmin)` — usar hook adicional condicional/segundo hook.
- Indicador visual: badge "projeção" quando `selectedMonth > mês atual` ou ano futuro; "congelado" quando passado.

### 3. Escopo intocado
- Previsão Anual (tabela mês a mês) segue mostrando o ano inteiro — não muda.
- Alertas, alocação do resultado, cards "Clientes Ativos" e "Investido" seguem baseados em `now` (não fazem sentido navegar por mês).

## Arquivos afetados
- `src/pages/GeneralDashboardPage.tsx` — única alteração.

## Sem mudanças de banco
Nenhuma.
