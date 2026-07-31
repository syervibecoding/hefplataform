# Reclassificar "CDB C6 LIM.GARANT." como investimento

## Situação atual (verificada no banco)

No fluxo de caixa existem 2 lançamentos avulsos gravados como **despesa** na categoria **Outros**:

- 01/07/2026 — "Outros gastos CDB C6 LIM.GARANT." — R$ 1.129,00
- 23/07/2026 — "Outros gastos CDB C6 LIM.GARANT." — R$ 800,00

Na tela de Investimentos existe a aplicação **CDB Liquidez Diária (C6)**, saldo inicial R$ 1.836,22 desde 02/06/2026, sem apelidos cadastrados. Os dois aportes acima **não** estão registrados nela.

Como estão como despesa, os R$ 1.929 estão reduzindo o resultado operacional e a margem de julho indevidamente.

## O que será feito

1. **Fluxo de caixa**: converter os dois lançamentos para tipo **investimento**, categoria **Investimentos**, com nome limpo "CDB C6 — Limite Garantido". Eles deixam de ser despesa operacional e passam a aparecer abaixo da linha do resultado (o motor do fluxo já trata `investimento` assim), continuando a impactar o saldo de caixa.
2. **Tela de Investimentos**: criar dois aportes na aplicação CDB Liquidez Diária (C6) — R$ 1.129,00 em 01/07 e R$ 800,00 em 23/07 — elevando o saldo da carteira para R$ 3.765,22.
3. **Apelidos**: cadastrar em CDB Liquidez Diária os apelidos `LIM.GARANT`, `LIM GARANT`, `CDB C6`, para que importações futuras já reconheçam essas linhas automaticamente como investimento.
4. **Margem**: com a reclassificação, julho perde R$ 1.929 de despesa "Outros" — resultado operacional e margem sobem automaticamente. O Dashboard Geral passa a mostrar esse valor no bloco de Investimentos do mês, abaixo do resultado.

## Detalhes técnicos

- `UPDATE public.cash_overrides` nas 2 linhas: `tipo='investimento'`, `categoria='investimentos'`, `nome='CDB C6 — Limite Garantido'`.
- `INSERT` em `public.investment_transactions` (aporte) para o investimento `34b020a2-...` nas mesmas datas/valores.
- `UPDATE public.investments SET aliases = ARRAY['LIM.GARANT','LIM GARANT','CDB C6']`.
- Nenhuma alteração de código é necessária: o cálculo de margem e a separação abaixo da linha já ignoram lançamentos do tipo `investimento`.
