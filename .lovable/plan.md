## Confirmação: o sistema já faz isso

Quando você editar o **Faturamento Mensal** (ou qualquer valor de ticket / mensalidade / contrato) em `EditClientDialog`, o comportamento atual é:

- **Meses passados** → permanecem congelados nos valores antigos (via `cash_month_snapshots`)
- **Mês atual em diante** → passam a usar o novo valor automaticamente

Ou seja: aumentar de R$ 2.500 para R$ 3.000 hoje faz o novo valor valer só do mês atual pra frente. O histórico não é recalculado.

## Verificação sugerida (sem mudanças de código)

Antes de fazer novos ajustes, vou apenas conferir se:

1. `useCashFlow.ts` está de fato consultando `cash_month_snapshots` para meses passados e ignorando o valor novo do cliente.
2. Existem snapshots gravados para os meses passados deste cliente (se não existirem, o primeiro acesso ao fluxo de caixa cria automaticamente com o valor atual — então **é importante abrir o Fluxo de Caixa uma vez ANTES** de editar o faturamento, para congelar o histórico com o valor antigo).

## Recomendação de fluxo para você

1. Abra a página **Fluxo de Caixa** e navegue pelos anos anteriores (garante que os snapshots antigos foram criados com os valores atuais).
2. Depois edite o Faturamento Mensal no cliente para o novo valor.
3. O novo valor aparecerá do mês corrente em diante; os meses anteriores manterão R$ 2.500.

## Melhoria opcional (posso implementar se quiser)

Adicionar um botão **"Congelar histórico agora"** no `EditClientDialog`, que dispara a criação de snapshots de todos os meses passados **antes** de salvar o novo valor — garantia extra para não depender de o usuário ter aberto o Fluxo de Caixa antes.

Quer que eu implemente essa melhoria, ou basta seguir o fluxo manual acima?