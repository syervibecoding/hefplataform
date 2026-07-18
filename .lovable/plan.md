# Previsão Anual no Dashboard Geral

Hoje o Dashboard Geral só mostra os KPIs do **mês corrente** (Faturamento Bruto, Impostos, Líquido, Resultado, Margem). Vamos adicionar uma seção de **previsão anual** usando o fluxo de caixa que já é carregado para os 12 meses do ano (`useCashFlowYear`), que já projeta receita e despesas mês a mês (respeitando reajustes de ticket, congelamento de meses passados e alíquota vigente).

## O que será adicionado

Nova seção "Previsão Anual · {ano}" logo abaixo do bloco de Alocação do Resultado, contendo:

**1. Cards de totais anuais (4 cards)**
- Faturamento Bruto Anual (soma das receitas dos 12 meses)
- Impostos Anuais (soma mês a mês, cada um com sua alíquota vigente via `rateForMonth`)
- Resultado Operacional Anual (Líquido − Despesas anuais)
- Margem Média Anual (Resultado Anual / Bruto Anual)

**2. Tabela mensal (Jan → Dez)**

Colunas: Mês · Bruto · Impostos (% vigente) · Líquido · Despesas · Resultado · Margem %

- Linhas passadas: usam os snapshots já congelados (vêm prontos do `cashFlow.months`).
- Mês atual: destacado visualmente.
- Meses futuros: projeção viva.
- Linha "Total" no rodapé com os agregados anuais.
- Scroll horizontal em mobile (padrão já usado nas outras tabelas).

**3. Mini-gráfico de barras**

Barras horizontais compactas comparando Resultado por mês (verde para positivo, vermelho para negativo), para o admin bater o olho na sazonalidade sem sair da página.

## Detalhes técnicos

- Arquivo alterado: `src/pages/GeneralDashboardPage.tsx`.
- Fonte de dados: `cashFlow.months[i].receitas` e `cashFlow.months[i].despesas` (já disponíveis via `useCashFlowYear`).
- Impostos por mês: `receitas[i] * rateForMonth(taxHistory, ano, i, taxRate) / 100` — respeita as vigências que já implementamos.
- Nenhuma nova query, nenhuma migração — apenas nova UI usando dados já em memória.
- Sem mudanças em regras de negócio, hooks ou banco.

## Fora do escopo (posso fazer em seguida se quiser)

- Previsão de anos futuros (2027+) — hoje `useCashFlowYear` é por ano; dá para adicionar um seletor.
- Projeção da Alocação do Resultado ao longo do ano.
- Incluir custo de API dos clientes HefSys na projeção (é o outro ponto que você levantou antes — segue pendente e não entra neste plano, aviso caso queira que eu inclua).
