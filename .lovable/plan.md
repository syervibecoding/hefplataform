## Problema

Hoje, se você edita o valor de contrato/mensalidade de um cliente (ou a alíquota de imposto), o fluxo de caixa recalcula tudo — inclusive meses passados — porque a projeção lê o valor atual do cadastro.

## Solução: congelar automaticamente meses passados

Regra:
- Ao editar qualquer valor (cliente, despesa recorrente, imposto), o novo valor vale **do mês atual em diante**.
- Todo mês que já passou vira "realizado" e não muda mais, mesmo que o cadastro seja alterado depois.
- Imposto/Selic: mudança **nunca** afeta mês passado.

## Como funciona por trás

1. **Snapshot mensal automático**
   - Nova tabela `cash_month_snapshots` guarda, por mês/cliente, o valor efetivamente usado (ticket, mensalidade, dia de pagamento).
   - Sempre que o fluxo de caixa é aberto, meses **anteriores ao atual** que ainda não têm snapshot são congelados automaticamente com o valor vigente naquele momento.
   - Meses futuros e o mês corrente continuam sendo projeção viva (recalculam ao editar o cadastro).

2. **Snapshot de imposto**
   - Nova tabela `tax_rate_history` (data_vigencia, aliquota).
   - O KPI de "Faturamento Líquido" usa a alíquota vigente **no mês de referência**, não a atual.
   - Ao editar a alíquota em Configurações, ela passa a valer do mês atual em diante — histórico intacto.

3. **Projeção**
   - `useCashFlowYear`:
     - Para cada mês < mês atual: se existe snapshot, usa o snapshot; se não existe, cria automaticamente com o valor vigente.
     - Para mês atual e futuros: usa cadastro atual (comportamento de hoje).
   - Overrides manuais continuam funcionando por cima do snapshot.

4. **Dashboard**
   - `impostos = Σ (receita_mês × alíquota_vigente_naquele_mês)` em vez de alíquota única × total.

## Estrutura técnica

**Migração:**
- `cash_month_snapshots` (id, ano, mes, origem_tipo, origem_id, nome, valor, categoria, dia_pagamento, created_at) — único por (ano, mes, origem_tipo, origem_id)
- `tax_rate_history` (id, vigente_desde YYYY-MM-01, aliquota numeric, created_at)
- GRANTs + RLS admin-only
- Seed: registra a alíquota atual (6%) como vigência inicial

**Código:**
- `src/hooks/useCashFlow.ts`: ao carregar, dispara `ensureSnapshots(year)` que faz upsert dos meses passados sem snapshot; projeção passa a ler snapshot quando existir.
- `src/hooks/useFinancialSettings.ts`: ao salvar nova alíquota, insere registro em `tax_rate_history` com `vigente_desde = 1º dia do mês atual`.
- `src/hooks/useTaxRateHistory.ts` (novo): retorna alíquota por mês.
- `src/pages/GeneralDashboardPage.tsx`: cálculo de impostos usa alíquota por mês.
- `src/components/FinancialSettingsDialog.tsx`: aviso "mudanças valem a partir de MM/AAAA — meses anteriores permanecem com a alíquota antiga".

**Sem alterações em:** cadastro de clientes, despesas ou lógica de overrides manuais.

## O que o usuário vê

- Um pequeno selo "Fechado" nos meses passados do fluxo de caixa (opcional, indica que estão congelados).
- Ao editar um ticket de cliente, fluxo passado fica igual; do mês atual em diante reflete o novo valor.
- Ao mudar a alíquota, KPI do mês corrente/futuros muda; passado mantém o cálculo antigo.
