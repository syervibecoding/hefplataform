## Objetivo

1. **Conectar sua chave OPENAI_API_KEY** para todas as chamadas de IA (extração + análise).
2. **Trocar o extrator atual de PDF** por um parser dedicado rodando no servidor (sem IA na extração — só na classificação).
3. **Nova página "Assistente Financeiro"** — chat dedicado onde você conversa com a IA usando seu fluxo de caixa real e a base de clientes/MRR como contexto.

---

## 1. Chave OpenAI

Vou pedir a `OPENAI_API_KEY` via `add_secret` (você cola o valor em formulário seguro). A chave fica disponível server-side e nunca vaza para o navegador.

Todas as chamadas existentes e novas para IA vão passar a usar:
- **Modelo padrão de chat/análise**: `gpt-5-mini` (rápido e barato pra conversa).
- **Modelo padrão de extração de transações**: `gpt-5-mini` com structured output (JSON schema).

Você pode trocar o modelo depois se quiser usar `gpt-5` (mais capaz) ou `gpt-5-nano` (mais barato).

---

## 2. Novo parser de PDF

A edge function `parse-financial-pdf` vai ser reescrita:

- **Extração**: usa `unpdf` (parser open-source, roda em Deno sem dependências nativas) para extrair o texto estruturado do PDF, página por página. Para PDFs com senha, recebe a senha do frontend e passa pro parser.
- **Classificação**: o texto cru vai pra OpenAI (com a sua chave) usando structured outputs (`response_format: json_schema`) — a IA só categoriza e estrutura, não "lê" o PDF.

Benefícios vs. hoje:
- Extração 100% determinística (mesma entrada → mesma saída).
- Mais barato: a IA só vê o texto limpo, não o PDF inteiro.
- Mais confiável em faturas longas (não perde linhas).

O fluxo do dialog de importação (upload → senha → revisão → confirmação) continua igual; só o motor server-side muda.

---

## 3. Página "Assistente Financeiro"

Nova entrada no sidebar: **Assistente** (ícone de mensagem).

**Comportamento**:
- Chat dedicado, single-conversation (sem threads), sem persistência por padrão — cada visita começa limpa, mas com um botão "Nova conversa" pra resetar manualmente.
- Markdown rendering nas respostas (tabelas, listas, gráficos em texto).
- Streaming em tempo real (token a token).

**Contexto que a IA recebe automaticamente** (system prompt + dados injetados a cada mensagem):
- Snapshot do **fluxo de caixa anual** do ano corrente: saldo inicial, receitas/despesas/investimentos/aportes/retiradas mês a mês, saldo final.
- **MRR e clientes ativos por produto**: total de clientes, ticket médio, soma mensal por produto.
- Data atual e mês de referência.

Tudo isso é montado numa edge function `financial-assistant-chat` antes de mandar pro modelo, então as respostas saem grounded nos seus números reais.

**Exemplos de perguntas que o assistente responde bem**:
- "Qual minha projeção de saldo até dezembro mantendo o ritmo atual?"
- "Em qual mês meu caixa fica mais apertado?"
- "Se eu cortar 20% das despesas administrativas, quanto sobra no final do ano?"
- "Que produto tem a melhor relação receita/cliente?"

**Limites**:
- Só admins acessam (mesma regra do fluxo de caixa).
- O assistente é consultivo — não cria/edita lançamentos sozinho. Se você quiser que ele insira despesas via chat, é uma segunda fase com tool calling.

---

## Detalhes técnicos

**Secrets**:
- `OPENAI_API_KEY` — solicitada via `add_secret`.

**Backend (edge functions)**:
- `parse-financial-pdf` (reescrita): `unpdf` para texto + OpenAI structured outputs para JSON.
- `financial-assistant-chat` (nova): monta contexto financeiro (fluxo de caixa + MRR) consultando o banco com service role, envia pra OpenAI Chat Completions em streaming, devolve SSE.

**Frontend**:
- `src/pages/AssistantPage.tsx` — chat UI com `react-markdown`, input no rodapé, scroll automático, botão "Nova conversa".
- `src/components/Sidebar.tsx` — novo item "Assistente" (visível só pra admin).
- `src/pages/Index.tsx` — rota `assistant` ligada à nova página.

**Sem mudanças de schema**: não preciso criar tabelas novas. Conversas não são persistidas.

---

## Fora do escopo desta entrega

- Persistência de conversas anteriores (pode ser adicionada depois).
- Tool calling (assistente criando lançamentos sozinho).
- Projeções gráficas geradas pela IA — por ora a resposta é em texto/markdown.
- CRM e renovações no contexto (só fluxo de caixa + clientes/MRR, conforme você escolheu).
