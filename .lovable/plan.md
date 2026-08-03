# Clientes ativos e receita por mês no Dashboard Geral

## Problema
O card "Clientes Ativos" e a receita por produto do Dashboard Geral usam sempre a foto de hoje: contam todo cliente com status "ativo" e calculam o valor com a data atual. Por isso, ao navegar para meses anteriores, o número de clientes e os valores aparecem iguais aos de hoje — um cliente novo ou um reajuste "vaza" para o passado.

## O que muda
1. O card **Clientes Ativos** passa a considerar o mês selecionado: só entram clientes cujo início de contrato (data de início / implementação) é anterior ou igual ao fim do mês selecionado.
2. A **receita por cliente** usada nos cards e na visão por produto passa a ser calculada para o mês selecionado (aplicando o reajuste vigente naquele mês), em vez do mês atual.
3. A seção **Clientes por Produto** e o alerta de contratos não assinados seguem o mesmo recorte de mês.
4. O rótulo do card indica o mês exibido, para deixar claro que é uma foto do período.

## Detalhes técnicos
- `useAllClients`: incluir `data_inicio` e `status` no select e no tipo `ClientRow`.
- `clientMonthlyRevenue`: já recebe uma data de referência — passar `new Date(selectedYear, selectedMonth, 1)` em vez de `now` no `revenueFor` do `GeneralDashboardPage`.
- Novo filtro `isActiveInMonth(c, monthEnd)`: exige `data_inicio <= monthEnd` (ou `data_implementacao <= monthEnd` para plataformas); clientes sem data de início continuam contando (fallback para não sumir histórico).
- `activeClients`, `recurringActiveClients`, `unsignedClients` e `clientsByProduct` passam a derivar dessa lista filtrada por mês.
- `useFinancialOverview` (usado no bloco por produto) recebe ano/mês como parâmetro e aplica o mesmo recorte, com a chave de cache incluindo o mês.

Sem mudanças de banco de dados.
