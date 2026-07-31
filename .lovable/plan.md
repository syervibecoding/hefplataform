# Marcar transações de investimento na importação

Hoje, ao importar extrato, uma linha como "CDB C6 LIM.GARANT." vira só uma despesa em "Outros". A ideia é que ela seja reconhecida como movimentação de investimento e caia automaticamente na carteira de Investimentos — continuando também no fluxo de caixa (é saída/entrada real de dinheiro).

## Como vai funcionar

1. **Detecção automática na revisão**
   - Palavras-chave nativas: CDB, LCI, LCA, TESOURO, RDB, APLICACAO, APLIC AUT, RESGATE, FUNDO, POUPANCA, INVEST, LIM.GARANT.
   - Apelidos por investimento: cada investimento cadastrado ganha um campo "Apelidos no extrato" (ex.: `CDB C6`, `C6 LIM.GARANT.`), igual ao que já existe em despesas recorrentes.
   - O parser de PDF também passa a sugerir `investimento: true` quando reconhecer o padrão.

2. **Nova coluna "Destino" na tela de revisão**
   - Valores: `Fluxo de caixa` (padrão) ou `Fluxo + Investimento`.
   - Quando for investimento, aparecem dois seletores extras na linha:
     - **Investimento** (lista dos investimentos ativos + opção "Criar novo…" com nome pré-preenchido pela descrição).
     - **Movimento**: Aporte (despesa) / Resgate (receita) / Rendimento — pré-selecionado pelo tipo da linha.
   - Badge roxo "Investimento" na coluna de status, com aviso de quantas linhas ainda estão sem investimento escolhido.
   - Botão "Marcar todos os investimentos detectados" no cabeçalho da revisão.

3. **Ao confirmar a importação**
   - A linha é gravada normalmente em `cash_overrides` (mantém o fluxo de caixa correto), com categoria fixa `investimentos`.
   - Em paralelo, é criada uma transação em `investment_transactions` vinculada ao investimento escolhido, com a mesma data, valor e uma nota "Importado de <origem>".
   - Ambos ficam ligados ao `import_id`, então **Reverter importação** remove as duas pontas.

4. **Nova categoria de despesa**: "Investimentos" entra em `EXPENSE_CATEGORIES` para os lançamentos ficarem separados no fluxo de caixa e nas análises.

## Detalhes técnicos

- Migração:
  - `ALTER TABLE investments ADD COLUMN aliases text[] NOT NULL DEFAULT '{}'`
  - `ALTER TABLE investment_transactions ADD COLUMN import_id uuid REFERENCES financial_imports(id) ON DELETE CASCADE`
- `src/lib/import-validation.ts`: nova função `detectInvestment(row, investments)` (keywords + aliases).
- `src/hooks/useFinancialImports.ts`: `confirmImport` recebe `investmentLinks` por linha e insere em `investment_transactions`; `revertImport` deleta também por `import_id` nessa tabela.
- `src/hooks/useInvestments.ts`: incluir `aliases` no tipo/mapeamento.
- `src/components/ImportFinancialDialog.tsx`: estados `destinos[]` e `investLinks[]`, coluna Destino, validação antes de salvar.
- `src/components/InvestmentsManagerDialog.tsx`: campo de apelidos no formulário do investimento.
- `supabase/functions/parse-financial-pdf/index.ts`: adicionar `investimento` (boolean) ao JSON Schema e instruir o prompt a marcar aplicações/resgates.
