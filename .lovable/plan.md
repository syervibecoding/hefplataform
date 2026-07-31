# Investimento fora da margem + padronização de nomes no fluxo

## Situação atual (verificada)

**1. Investimento HOJE afeta a margem — não está como você descreveu.**
O fluxo de caixa já tem um tipo próprio de lançamento `investimento`, que é corretamente excluído do resultado operacional (receitas − despesas) e só entra depois, no saldo final. Porém a importação de extrato que acabamos de montar grava as linhas de investimento como **despesa** na categoria "Investimentos". Resultado: um CDB de R$ 5.000 hoje derruba resultado operacional e margem.

**2. Termos repetidos / categorias erradas no fluxo (dados reais):**
- Despesa recorrente "Lovable" (R$ 550, software) convive com as linhas reais da fatura "LOVABLE DO" — e essas linhas reais estão em categorias erradas: Mai/26 e Jul/26 como **pessoal**, Jun/26 como **software**. Duas vezes o mesmo custo em vários meses.
- Despesa recorrente "API" (R$ 1.300, software) é justamente INFOSIMPLES + SERPRO. Os PIX reais da INFOSIMPLES (Jul: 500 + 400 + 400) entraram como avulsos, sem substituir a recorrente — e um deles ficou em **infraestrutura**.
- Descrições cruas do extrato: "Saída PIX   Pix enviado para INFOSIMPLES PROCESSAMENTO DE DADOS LTDA", "LOVABLE DO", "OPENAI *CHATGPT SUBSCR SA".
- Recorrente "GPT" (R$ 120) vs. "OPENAI *CHATGPT SUBSCR SA" real (~R$ 107).
- As linhas de **IOF Transações Exterior** foram para a categoria **impostos**. Como o Dashboard Geral lê "impostos" do fluxo como sendo o DAS real, o IOF está sendo tratado como imposto sobre faturamento e distorce o card de impostos e a margem.

## O que será feito

### A. Investimento não entra na margem
- A importação passa a gravar a linha como `tipo = investimento` (em vez de despesa) quando o destino for "Fluxo + Investimento". Isso já é suportado pelo banco e pelo motor do fluxo.
- Dashboard Geral: nova linha de leitura em cascata — Faturamento bruto → Impostos → Faturamento líquido → Despesas operacionais → **Resultado operacional / Margem** → Investimentos do mês → Aportes/Retiradas → Variação de caixa. Investimento aparece como card informativo, **abaixo** do resultado, nunca somado às despesas.
- Ajuste na previsão anual e no mini-gráfico para usar a mesma regra.

### B. Padronização de nomes e categorias
- **Apelidos de fornecedor**: cadastrar nas despesas recorrentes já existentes:
  - "Lovable" → apelidos `LOVABLE`, `LOVABLE DO`
  - "API" → renomear para "API (Infosimples + Serpro)" com apelidos `INFOSIMPLES`, `SERPRO`
  - "GPT" → renomear para "OpenAI / ChatGPT" com apelidos `OPENAI`, `CHATGPT`
  Com isso, toda importação futura já reconhece a linha como realizado da recorrente e oferece "Substituir recorrente".
- **Limpeza da descrição na importação**: remover prefixos de extrato ("Saída PIX Pix enviado para", "Compra no débito", "Pagamento de boleto") e, quando a linha casar com um apelido, exibir/salvar o nome canônico do fornecedor com o valor real.
- **Categoria correta automática**: quando a linha casa com uma recorrente, herda a categoria dela (Lovable/OpenAI/Infosimples → Software & Tecnologia), em vez da categoria adivinhada pela IA.
- **IOF**: deixa de ser "impostos" e passa a ser classificado junto com a compra de origem (Software & Tecnologia), com opção de agregar ao valor da própria linha. O card de impostos do Dashboard passa a considerar só o DAS.
- **Correção retroativa dos dados já lançados** (Abr a Jul/26): reclassificar "LOVABLE DO" para Software & Tecnologia, INFOSIMPLES para Software & Tecnologia, tirar o IOF de impostos e renomear as descrições para o padrão. As duplicidades Lovable/API recorrente × realizado serão listadas para você decidir mês a mês.

## Detalhes técnicos
- `src/hooks/useFinancialImports.ts` / `src/components/ImportFinancialDialog.tsx`: gravar `tipo: "investimento"` para destino investimento; herdar categoria da recorrente casada; normalizar descrição.
- `src/lib/import-validation.ts`: função de normalização de descrição por prefixo + resolução de nome canônico via `aliases`.
- `src/pages/GeneralDashboardPage.tsx`: separar investimentos do bloco de despesas; nova cascata de KPIs; excluir IOF do imposto real (só categoria `impostos` menos linhas marcadas como IOF).
- Dados: `UPDATE` em `cash_overrides` para categoria/nome das linhas Lovable, OpenAI, Infosimples e IOF; `UPDATE` em `cash_expenses` para nomes e `aliases`.
