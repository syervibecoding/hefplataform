## Objetivo

Criar um ambiente onde você faz upload de **extratos bancários** e **faturas de cartão** (PDF), a plataforma extrai as transações automaticamente via IA, você revisa/categoriza em massa e confirma — e tudo cai no Fluxo de Caixa real, sem digitação manual.

> Observação: os 2 PDFs que você anexou estão protegidos por senha. O importador vai pedir a senha quando detectar isso.

---

## Fluxo de uso

1. Em **Fluxo de Caixa**, novo botão **"Importar extrato/fatura"**.
2. Drag-and-drop de 1 ou mais PDFs (extrato bancário ou fatura de cartão). Se o PDF for protegido, abre campo de senha.
3. A IA (Gemini via Lovable AI) lê o PDF e devolve uma lista estruturada de transações: `data`, `descrição`, `valor`, `tipo` (entrada/saída), `categoria sugerida` e `origem` (banco/cartão detectado).
4. Tela de **revisão em lote**: tabela editável com todas as linhas extraídas. Você pode:
   - Marcar/desmarcar linhas (excluir o que não quer importar — ex: pagamento da própria fatura para não duplicar)
   - Editar descrição, valor, data, categoria, tipo
   - Aplicar categoria em massa para linhas selecionadas
   - Ver alerta de **possíveis duplicatas** (mesma data + valor + descrição similar já existente no `cash_overrides`)
5. **Confirmar importação** → grava tudo como lançamentos em `cash_overrides` (mesma tabela que o "Novo lançamento" usa hoje), aparecendo direto no fluxo de caixa.
6. Histórico de importações: lista de PDFs importados com data, qtd. de lançamentos, e botão "Reverter" (apaga em lote os lançamentos daquela importação).

---

## Comportamento da IA

- **Extrato bancário**: extrai movimentações (PIX, TED, boletos, tarifas), classificando entrada/saída pelo sinal/coluna.
- **Fatura de cartão**: extrai cada compra como **despesa** com data da compra, e ignora linhas de "pagamento de fatura" / "saldo anterior" (para não duplicar com o débito que já aparece no extrato).
- **Categorização automática** usando as categorias que já existem em `EXPENSE_CATEGORIES` (alimentação, software, marketing, etc.) com base na descrição.
- **Detecção de origem**: tenta identificar o banco/bandeira pelo cabeçalho do PDF e marca isso no `nome` do lançamento (ex: "Inter — Uber 12/03").

---

## Detalhes técnicos

**Backend (Edge Function)** — `supabase/functions/import-financial-pdf/index.ts`:
- Recebe `{ pdfBase64, password?, kind: "extrato" | "fatura" | "auto" }`.
- Se PDF tem senha, descriptografa com `qpdf` equivalente em JS (`pdf-lib` não suporta — usar `pdfjs-dist` com `password`) ou pede a senha de novo.
- Extrai texto com `pdfjs-dist` (já roda em Deno).
- Envia o texto para **Lovable AI Gateway** (`google/gemini-2.5-flash`) com prompt estruturado pedindo JSON: `{ origem, periodo, transacoes: [{data, descricao, valor, tipo, categoria_sugerida}] }`.
- Retorna o JSON para o frontend (sem gravar nada ainda — a gravação é só após revisão do usuário).

**Banco** — nova tabela `financial_imports` para histórico:
- `id`, `created_by`, `kind` (extrato/fatura), `source_name` (nome do arquivo / banco detectado), `period_start`, `period_end`, `transactions_count`, `created_at`.
- Em `cash_overrides`, adicionar coluna nullable `import_id` (FK → `financial_imports.id`) pra permitir o "Reverter importação".
- RLS: só admins (mesma regra atual do fluxo de caixa).

**Frontend**:
- `src/components/ImportFinancialDialog.tsx` — modal multi-step (upload → senha se necessário → loading IA → tabela de revisão → confirmação).
- `src/pages/CashFlowPage.tsx` — adicionar botão "Importar extrato/fatura" no header e seção "Importações recentes" no rodapé.
- `src/hooks/useFinancialImports.ts` — list / revert.

---

## Fora do escopo desta entrega

- OFX/CSV (fica para depois, se quiser).
- Conexão direta com Open Finance / API de banco (precisa de credenciais de produção e contrato — não é viável agora).
- Conciliação automática com clientes (marcar PIX recebido como "pagamento do cliente X") — possível como segunda fase.

---

## Pontos para você confirmar

1. Os dois PDFs anexados estão **com senha**. Confirma que o fluxo deve ter campo de senha por arquivo? (sim/não)
2. Para **fatura de cartão**, prefere lançar cada compra individual no dia da compra, ou um único lançamento consolidado no dia do vencimento? (recomendo individual = visão real do gasto)
3. Quer também um modo "preview rápido" que só mostra o resumo (total entradas/saídas) sem precisar revisar linha-a-linha?
