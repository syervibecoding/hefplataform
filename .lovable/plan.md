## Objetivo

Quando você abrir "Novo Cliente" em qualquer produto (HefSys, Tráfego, Automação, Plataformas), aparecer no topo do formulário um campo de busca com **todos os clientes já cadastrados em qualquer produto**. Ao selecionar um, os dados básicos (nome, contato, whatsapp, email) são preenchidos automaticamente — você só precisa completar os campos específicos do produto.

## Como vai funcionar na prática

1. No diálogo "Novo Cliente", logo acima dos campos atuais, vou adicionar uma seção opcional:
   - **"Reaproveitar cliente existente"** com um campo combobox (busca por nome).
   - A lista mostra todos os clientes do banco, com o nome da empresa + um chip indicando em quais produtos ela já existe (ex: "Acme Ltda · Consultoria, Plataformas").
   - Clientes que já existem **no mesmo produto** ficam desabilitados (para evitar duplicar dentro do mesmo produto).
2. Ao selecionar um cliente da lista:
   - Preenche automaticamente: nome, contato, WhatsApp, email, status.
   - Mostra um aviso discreto: "Dados copiados de [Produto X]. Edite se necessário."
   - Um botão pequeno "Limpar seleção" volta o formulário para entrada manual.
3. Os campos específicos do produto (valor de contrato, consultas, kickoff etc.) continuam em branco para você preencher.
4. Se você não selecionar nada, o comportamento é exatamente o atual.

## Detalhes técnicos

- **Hook novo `useDistinctClients`** (ou estender `useAllClients`): retorna uma lista deduplicada por nome (ou por email se houver) contendo `{ nome, contato, whatsapp, email, productsIn: ProductId[] }`. Como hoje cada produto tem sua própria linha em `clients`, vou agregar no client-side agrupando por `lower(trim(nome))`.
- **`AddClientDialog.tsx`**:
  - Adicionar prop ou consumir o hook diretamente.
  - Adicionar um `Popover` + `Command` (shadcn) no topo do form, antes do grid de Nome/Contato.
  - Função `applyExistingClient(c)` que faz `setValue` nos quatro campos base e marca um estado `linkedFromName` para exibir o aviso.
  - Filtrar do dropdown os clientes onde `productsIn.includes(activeProduct)`.
- **Sem mudanças no banco** nem nas RLS — leitura usa as policies já existentes da tabela `clients`.
- **Sem alteração na lógica de submissão**: continua criando um novo registro em `clients` para o produto ativo (cada produto é uma linha independente, como hoje). Isso preserva o histórico financeiro por produto.

## Fora do escopo (posso fazer depois se quiser)

- Unificar de verdade os clientes (uma única empresa com múltiplos vínculos de produto) — exigiria refactor maior da tabela `clients`.
- Sincronizar alterações de contato entre produtos automaticamente.
- Reaproveitar dados também em `platform_companies` (clientes só do portal de plataformas).
