
## Objetivo

Permitir cadastrar reajustes futuros (aumento ou redução) do valor mensal de um cliente sem alterar o histórico de fluxo de caixa. Aplica-se a:
- Consultoria (Valor do Contrato)
- Heffsys (Faturamento)

Comissão do comercial (consultoria) recalcula automaticamente a partir do novo valor.

## Como o usuário vai usar

No dialog de Edição do cliente, abaixo do campo de valor (Faturamento / Valor do Contrato), aparece um bloco "Reajustes de valor" com uma lista de linhas:

- Data de início (a partir de qual mês vale o novo valor)
- Novo valor (R$/mês)
- Botão remover

Botão "Adicionar reajuste". Aviso curto: "Meses passados já lançados no fluxo permanecem congelados. Reajustes valem para os meses ainda não fechados."

## Modelo de dados

Nova tabela `client_value_adjustments`:

- `client_id` (FK clients, cascade)
- `data_inicio` date — primeiro dia em que o novo valor vale
- `novo_valor` numeric
- índice em (client_id, data_inicio)

RLS igual às demais tabelas do time interno (SELECT/INSERT/UPDATE/DELETE para authenticated, ALL para service_role; policies via `is_internal_team()`).

## Regra de projeção

Para cada mês `m` do ano projetado:

1. Buscar o reajuste mais recente com `data_inicio <= último dia do mês m` para aquele cliente.
2. Se existir, `valorEfetivo = novo_valor`. Caso contrário, usa `valor_contrato` (consultoria) ou `faturamento` (hefsys).
3. Meses passados já preservam o comportamento atual via `cash_month_snapshots` — nada muda no histórico.
4. Comissão consultoria: `comissao = valorEfetivo × comissao_percentual / 100` (recalcula com o reajuste vigente).

Isso vale tanto em `useCashFlow.ts` quanto em `freezeClientHistory.ts` (para congelar corretamente quando um mês passa a ser histórico).

## Arquivos afetados

- Migration: cria `client_value_adjustments` com GRANTs + RLS.
- `src/hooks/useClients.ts`: nada muda (reajustes têm hook próprio).
- Novo `src/hooks/useClientValueAdjustments.ts`: CRUD + invalidação de `["cash-flow"]` e `["clients"]`.
- `src/components/EditClientDialog.tsx`: novo bloco "Reajustes de valor" visível para `hefsys` e `consultoria-clix`, abaixo do input de valor.
- `src/hooks/useCashFlow.ts`:
  - incluir `client_value_adjustments` no `fetchAll`.
  - função helper `getValorEfetivo(client, adjustments, year, month)`.
  - usar em `hefsys` (default), `consultoria-clix` (default + comissão).
- `src/lib/freezeClientHistory.ts`: mesma helper para congelar meses passados com o valor vigente na época.
- `src/integrations/supabase/types.ts`: regenerado pela migration.

## Fora de escopo

- Reajustes em Plataformas (implementação/mensalidade).
- Aviso/preview em tela dos próximos reajustes fora do dialog.
- Histórico auditável de quem criou cada reajuste.
