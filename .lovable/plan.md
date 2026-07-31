# Atualizar saldo bruto do investimento

Hoje, em Investimentos, o saldo é apenas calculado (saldo inicial + aportes - resgates + rendimentos lançados). A ideia é poder informar o **saldo bruto atual** da aplicação (o que o banco mostra) e o sistema calcular sozinho o rendimento do período.

## Como vai funcionar

- Em cada aplicação, ao lado do "Saldo atual", um botão **Atualizar saldo**.
- Ao clicar, abre um campo para digitar o saldo bruto atual e a data (padrão: hoje).
- O sistema compara com o saldo calculado e mostra a prévia: "Rendimento apurado: R$ X" (ou ajuste negativo).
- Ao confirmar, é criado automaticamente um lançamento do tipo **rendimento** com a diferença, na data informada. O saldo passa a bater exatamente com o valor digitado.
- Se a diferença for zero, nada é lançado.
- Se for negativa (perda, taxa ou IR), o lançamento é registrado com valor negativo e aparece no histórico em cor de alerta.
- O histórico continua igual, agora identificando esses lançamentos como "ajuste de saldo".
- Cada aplicação passa a mostrar também o **total de rendimentos acumulados** e o **% sobre o valor aplicado**.

## Escopo

- Alteração apenas na tela de Investimentos. Dashboard Geral, margens e resultado operacional não mudam — rendimentos seguem abaixo da linha.

## Detalhes técnicos

- `InvestmentsManagerDialog.tsx`: novo modo de edição inline "atualizar saldo" por investimento (estado local, no mesmo padrão do `editingRate` já existente), cálculo do delta contra o saldo derivado e criação de uma linha em `investment_transactions` com `tipo='rendimento'` e `notas='Ajuste de saldo bruto'`.
- Sem migração de banco: `investment_transactions` já tem `tipo`, `valor`, `data` e `notas`. Ajustar apenas validações do lado do cliente para permitir valor negativo nesse caso.
- Rendimento acumulado por aplicação calculado no cliente a partir das transações já carregadas.