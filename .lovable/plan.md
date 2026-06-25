# Histórico de importações + validação prévia

## 1. Nova página "Importações" no menu
- Adicionar item **Importações** na `Sidebar.tsx` (admin-only, ícone `FileUp`), abaixo de "Fluxo de Caixa".
- Registrar rota `/importacoes` em `src/pages/Index.tsx` → nova página `FinancialImportsPage.tsx`.
- Atualizar título no `Topbar.tsx`.

## 2. Página `FinancialImportsPage.tsx`
Layout em duas seções:

**Topo — ação principal**
- Botão **"Nova importação"** que abre o `ImportFinancialDialog` já existente.

**Lista de histórico** (usa `useFinancialImports(true)` já existente)
Tabela com colunas:
- Data da importação
- Origem (banco/cartão + nome do arquivo)
- Tipo (Extrato / Fatura)
- Período (início → fim)
- Nº transações
- Totais (+receitas / −despesas) — calculados a partir de `cash_overrides` filtrados por `import_id`
- Ações: **Ver detalhes**, **Exportar CSV**, **Reverter**

**Ver detalhes** → abre um `Dialog` listando as transações daquela importação (mesma tabela do passo de revisão, somente leitura).

**Exportar CSV** → gera CSV no cliente (data, descrição, tipo, categoria, valor) a partir das transações da importação.

**Reverter** → confirma e chama `revertImport` (já existente em `useFinancialImports`).

## 3. Validação antes de confirmar importação
Alterar o passo **"review"** do `ImportFinancialDialog.tsx`:

**a) Banner de conferência (totais)**
Já existe a soma de entradas/saídas no topo. Adicionar **saldo do período** (= receitas − despesas) bem destacado, para o usuário comparar com o PDF.

**b) Aviso de sobreposição de período**
Ao entrar no passo "review", consultar `financial_imports` filtrando por:
- mesma `kind`
- mesma `origem` (quando detectada)
- período que se sobrepõe a `periodo_inicio`/`periodo_fim` do novo PDF

Se houver, mostrar um alerta amarelo no topo:
> "O período X já foi importado em DD/MM/AAAA (origem Y). Confira para evitar duplicidade."
Com link "Ver importação" abrindo o detalhe.

**c) Duplicatas vs. lançamentos existentes**
Ao entrar no "review", buscar em `cash_overrides` todas as linhas cuja `data` esteja no intervalo `[periodo_inicio, periodo_fim]` (uma query só). Para cada linha do PDF, marcar como **duplicata provável** se existir registro com:
- mesma `data`
- mesmo `tipo`
- mesmo `valor` (até 2 casas)
- e descrição com similaridade alta (normalizar: lowercase, sem acento, ignorar nº de parcela; match se uma string contém a outra OU Jaccard de tokens ≥ 0.7)

Comportamento na tabela do "review":
- Coluna nova com badge **"Duplicata"** (amarelo) quando suspeita.
- Tooltip no badge mostra o lançamento existente (data, valor, descrição) que casou.
- Duplicatas vêm com `include = false` por padrão.
- Botão extra **"Desmarcar duplicatas"** ao lado de "Marcar/Desmarcar todos".
- Contador no rodapé: "X duplicatas detectadas, Y selecionadas para importar".

## 4. Detalhes técnicos
- **Totais por importação** no histórico: agregar `cash_overrides` por `import_id` numa única query (`select tipo, valor, import_id from cash_overrides where import_id in (...)`) e somar no cliente.
- **Detecção de duplicatas**: utilitário puro em `src/lib/import-validation.ts` (`detectDuplicates(rows, existing)` + `normalizeDescription`) para ficar testável.
- **Sobreposição de período**: utilitário `findPeriodOverlap(imports, kind, origem, start, end)` no mesmo arquivo.
- **CSV**: helper `exportImportToCsv(import, rows)` que monta o blob e dispara download.
- Nenhuma mudança de schema é necessária (todos os dados já estão em `financial_imports` + `cash_overrides.import_id`).
- RLS já cobre essas tabelas (admin-only conforme políticas existentes).

## Fora de escopo
- Detecção de duplicatas dentro do próprio PDF.
- Reprocessar/re-extrair uma importação antiga.
- Edição das transações depois de salvas (continua via Fluxo de Caixa).
