

# Melhorias no CRM de Prospecção

## Problema identificado
Atualmente, o **Valor do Pipeline** inclui todos os prospects exceto os "Perdidos". Isso significa que leads frios (ex: "Lead Identificado" / "novo_lead") inflam o valor real do pipeline, dando uma visão imprecisa.

## Melhorias propostas

### 1. Excluir leads frios do valor do Pipeline
O cálculo do `totalPipeline` será atualizado para excluir tanto "perdido" quanto "novo_lead" (ou a primeira etapa do funil dinâmico). Assim, apenas prospects que já tiveram algum avanço no funil serão considerados no valor.

### 2. Adicionar métrica de "Leads Frios"
Novo card de métrica mostrando a quantidade de leads na primeira etapa, para manter visibilidade sem poluir o pipeline.

### 3. Adicionar taxa de conversão
Um novo card com a % de conversão (convertidos / total excluindo leads frios), dando uma visão mais útil da performance comercial.

### 4. Mostrar valor por etapa no Kanban
Exibir um subtotal de valor estimado no header de cada coluna do Kanban, facilitando a análise por fase.

## Alterações técnicas

**Arquivo:** `src/pages/CRMPage.tsx`

- Atualizar filtro do `totalPipeline` para excluir a primeira etapa (position 0) além de "perdido"
- Reorganizar grid de métricas (5 cards): Total de Prospects, Leads Frios, Valor do Pipeline, Convertidos, Taxa de Conversão
- Adicionar soma de valor no header de cada coluna do Kanban

Nenhuma alteração de banco de dados necessária.

