# Edição inline das células do Fluxo de Caixa

Permitir que o admin clique em qualquer célula numérica das **linhas filhas** (cliente, despesa, item de investimento) da tabela do Fluxo de Caixa e edite o valor daquele mês. O valor digitado **substitui** a projeção automática via `cash_overrides`.

## Comportamento

- Clique simples na célula → vira `<input>` numérico já focado e selecionado.
- Confirma com **Enter** ou **Tab/blur**; cancela com **Esc**.
- Valor vazio ou `0` zera o mês (override com valor 0).
- Mostra spinner curto enquanto salva; React Query revalida e a tabela recalcula sozinha (subtotais, totais, resultado, saldo).
- Indicador visual sutil (ex.: ponto/sublinhado) quando a célula já é override manual, para distinguir do valor projetado.
- Linhas pai (produto/categoria) e linhas de Total **continuam somente leitura**.

## Regras de gravação (cash_overrides)

Para cada célula `(item, mês)`, há no máximo 1 override. Determinar a chave `origem_tipo` + `origem_id`:

| Tipo de linha | origem_tipo | origem_id |
|---|---|---|
| Receita de cliente | `cliente` | `client.id` |
| Despesa cadastrada | `despesa` | `expense.id` |
| Investimento avulso existente | `avulso` | `null` (atualiza pelo `overrideId` da linha) |
| Linha avulsa de receita/despesa (já é override) | `avulso` | `null` (atualiza pelo `overrideId`) |

Fluxo no salvar:
1. Se a linha já tem `overrideId` naquele mês → `update` pelo id.
2. Senão, procurar override existente em `cash_overrides` com mesmo `origem_tipo`+`origem_id` no mês → se achar, `update`; senão, `insert`.
3. Campos: `tipo` (= tipo da seção), `nome` (= label da linha), `categoria` (= `product_id` para receita ou categoria da despesa/investimento), `data` (dia padrão do mês — dia 5 para receitas/despesas avulsas; ou preservar o dia da entrada projetada quando houver), `valor`.

## Detalhes técnicos

- **Novo componente** `src/components/EditableCashCell.tsx`: célula controlada com modos view/edit; recebe `value`, `loading`, `isOverride`, `onSave(valor)`.
- **`src/hooks/useCashOverrides.ts`**: adicionar `upsertForOriginMonth({ tipo, origemTipo, origemId, overrideId, year, month, nome, categoria, dia, valor })` que encapsula a lógica de procurar/atualizar/inserir. Invalida `["cash-flow"]`.
- **`src/hooks/useCashFlow.ts`**: incluir `overrideId` nas árvores agregadas — propagar de `CashEntry.overrideId` até a estrutura `children[].values` para que a célula saiba qual id usar. Estrutura passa de `values: number[]` para `values: { valor: number; overrideId: string | null; isOverride: boolean }[]` (ou um mapa paralelo).
- **`src/pages/CashFlowPage.tsx`**: substituir os `<td>` numéricos das linhas filhas (receitas, despesas, investimentos) por `<EditableCashCell>`. Manter `stopPropagation` no clique para não disparar o toggle da linha pai.
- Permissão: já restrito a admin (RLS em `cash_overrides` exige `admin`).

## Fora do escopo

- Não editar células de produto/categoria/totais.
- Não criar novas linhas pela tabela (continua via botão "Lançamento" / clique no mês).
- Sócios (aportes/retiradas) não têm linhas filhas — sem mudança.
