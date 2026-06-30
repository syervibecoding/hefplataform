
## Objetivo

Refinar o `SYSTEM_PROMPT` da edge function `financial-assistant-chat` para que as respostas do assistente venham mais bem formatadas, arejadas e fáceis de ler — sem mexer no contexto financeiro nem na UI.

## O que muda

Apenas um arquivo:
- `supabase/functions/financial-assistant-chat/index.ts` → reescrever o `SYSTEM_PROMPT` com regras explícitas de formatação.

Nada de UI, nada de lógica de contexto, nada de modelo novo.

## Novas regras de formatação que serão adicionadas ao prompt

1. **Estrutura padrão de resposta**
   - Começar com 1 frase curta de resposta direta (TL;DR), em **negrito**.
   - Depois detalhar em seções com `##` (títulos curtos, no máximo 3-4 palavras).
   - Encerrar sempre com seção `## Pontos de atenção` quando houver risco/decisão; e `## Próximo passo` com 1 ação concreta.

2. **Espaçamento e legibilidade**
   - Sempre deixar **linha em branco** entre parágrafos, listas, títulos e tabelas (evita "texto colado").
   - Parágrafos curtos: no máximo 3 linhas. Quebrar ideias longas em listas.
   - Nunca emendar número + explicação em parágrafo longo — usar lista.

3. **Listas e números**
   - Usar bullets `-` para enumerar achados, riscos ou recomendações.
   - Quando comparar meses/categorias/produtos, **preferir tabela markdown** a parágrafo.
   - Valores monetários sempre em `**R$ 12.345,67**` (negrito) para destacar.
   - Variações percentuais entre parênteses ao lado do valor: `R$ 10.000,00 (+12% vs. mês anterior)`.

4. **Tom**
   - Direto, consultivo, em português do Brasil.
   - Sem floreios ("Espero ter ajudado", "Vamos analisar juntos", etc).
   - Sem repetir a pergunta do usuário.

5. **Quando a resposta for curta** (1 número, 1 mês, sim/não)
   - Responder em 1-2 frases, sem títulos nem seções. Não forçar estrutura.

## Exemplo que será incluído no prompt (few-shot)

Um mini-exemplo de pergunta + resposta bem formatada para ancorar o modelo, mostrando: TL;DR em negrito → tabela → bullets de atenção → próximo passo.

## Fora de escopo

- Não alterar `AssistantPage.tsx` (markdown já é renderizado com `react-markdown` + `remark-gfm`, então tabelas e listas já funcionam).
- Não trocar o modelo (`gpt-5-mini`).
- Não mexer no `buildContext`.
