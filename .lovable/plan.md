# Histórico das últimas 3 conversas do Assistente Financeiro

Hoje o assistente avisa "As conversas não são salvas". Vamos persistir cada conversa no banco e exibir um atalho com as 3 mais recentes de **todos os admins**, dentro da própria página do assistente.

## Backend (Lovable Cloud)

Nova tabela `assistant_conversations`:
- `user_id` (autor)
- `title` (gerado a partir da 1ª pergunta — primeiros ~60 chars)
- `messages` (jsonb — array `{role, content}`)
- `created_at`, `updated_at`

Regras de acesso:
- SELECT: qualquer admin (via `has_role(auth.uid(),'admin')`) — todos veem todas.
- INSERT/UPDATE: apenas o próprio autor (admin), garantindo `user_id = auth.uid()`.
- DELETE: apenas o autor ou admin.
- GRANTs padrão para `authenticated` e `service_role`.

## Frontend (`src/pages/AssistantPage.tsx`)

1. **Persistência automática**: assim que o assistente termina de responder (1ª mensagem completa), cria o registro com `title` derivado da pergunta. Nas mensagens seguintes da mesma conversa, faz `update` do mesmo id (com `messages` e `updated_at`).
2. **Painel "Conversas recentes"** no topo direito do header (ao lado de "Nova conversa"):
   - Botão `Histórico` com contador.
   - Abre um `Popover`/dropdown listando as **3 conversas mais recentes** (qualquer admin), mostrando:
     - Título
     - Autor (username via `get_username`)
     - Data relativa ("há 2h")
   - Click → carrega `messages` no estado atual e desativa novo `insert` (continua usando `update` no id carregado).
3. **"Nova conversa"** continua zerando o estado e o id ativo, voltando ao fluxo de criação.
4. Atualizar o rodapé: trocar "As conversas não são salvas" por "Conversas ficam salvas e visíveis para admins".

## Detalhes técnicos

- Novo hook `useAssistantConversations` (React Query):
  - `listRecent(limit=3)` → ordenado por `updated_at desc`.
  - `create({title, messages})` → retorna id.
  - `update(id, messages)`.
- Salvamento dispara só ao final do stream (no `finally` do `send`) para evitar gravar parciais.
- Título: `text.slice(0,60)` da 1ª mensagem do usuário; se truncado, adiciona "…".
- Tipos do Supabase serão regenerados após a migration.

Nada mais é alterado — o restante da página (sugestões, streaming, contexto financeiro) permanece igual.