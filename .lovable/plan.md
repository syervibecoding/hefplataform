

# Plano de Implementacao: Checklists Dinamicos, Autenticacao e Controle de Acesso

Este plano cobre tres melhorias solicitadas:

1. Checklists acompanham a agenda (se mudar o dia, o checklist reflete)
2. Sistema de login com usuario e senha (sem email)
3. Controle de acesso: dados financeiros so para admin + rastreio de quem deu check

---

## 1. Checklists Acompanham a Agenda

**Problema atual**: O checklist salva o `periodo` como data fixa (ex: `2026-02-15`). Se voce mover a consulta do dia 15 para o dia 20, o checklist antigo fica "orfao" e o dia 20 aparece vazio.

**Solucao**: O componente `ProcessChecklist` ja recalcula as datas de execucao dinamicamente a partir da `ScheduleConfig` do cliente. Quando a agenda muda, as datas listadas ja mudam. O problema e que os dados salvos com a data antiga ficam perdidos.

**Abordagem**:
- Ao detectar que a agenda mudou (ex: dia 15 virou dia 20), o sistema automaticamente migra os registros de checklist para a nova data
- Na pratica: quando o componente carrega, ele compara as datas salvas no banco com as datas calculadas pela agenda atual. Se houver datas orfas (salvas mas nao existem mais na agenda) e datas novas sem dados, o sistema oferece a opcao de mover os dados

**Mudancas**:
- `src/hooks/useClientChecklist.ts`: Adicionar logica de reconciliacao que atualiza o campo `periodo` dos registros orfaos para as novas datas calculadas
- `src/components/ProcessChecklist.tsx`: Usar os dados reconciliados

---

## 2. Sistema de Login (Usuario e Senha)

**Contexto**: Atualmente nao ha autenticacao. Precisamos de um sistema de login com usuario e senha (sem email).

**Abordagem**: Usar o sistema de autenticacao do Lovable Cloud com email como campo interno, mas apresentar ao usuario como "nome de usuario". Na pratica, cada usuario tera um email gerado automaticamente (ex: `joao@internal.local`) para compatibilidade com o sistema, mas na interface so aparece o nome de usuario.

**Mudancas no banco de dados** (migracao SQL):
- Criar tabela `profiles` com campos: `id` (referencia auth.users), `username` (texto unico), `display_name`
- Criar tabela `user_roles` com campos: `id`, `user_id`, `role` (enum: admin, user)
- Criar funcao `has_role` (security definer) para verificar roles sem recursao RLS
- Atualizar RLS de todas as tabelas existentes para exigir autenticacao
- Criar trigger para auto-criar perfil no signup

**Novos arquivos**:
- `src/pages/LoginPage.tsx`: Tela de login com campos usuario e senha
- `src/hooks/useAuth.ts`: Hook para gerenciar estado de autenticacao
- `src/contexts/AuthContext.tsx`: Contexto global de autenticacao e role do usuario

**Arquivos modificados**:
- `src/App.tsx`: Adicionar rotas protegidas e redirecionamento para login
- `src/components/Sidebar.tsx`: Adicionar botao de logout e exibir nome do usuario

---

## 3. Controle de Acesso por Role

### 3A. Dados financeiros so para admin

**Campos protegidos**: `faturamento`, `custoAPI`, `valorContrato` na pagina de detalhes e na listagem de clientes.

**Mudancas**:
- `src/pages/ClientDetailPage.tsx`: Condicionar exibicao de Faturamento/Mes e Custo API/Mes ao role "admin"
- `src/pages/ClientsPage.tsx`: Ocultar colunas Faturamento e Custo API para nao-admins
- `src/pages/DashboardPage.tsx`: Ocultar cards financeiros (Faturamento/Mes, Custo API/Mes, Receita Mensal) para nao-admins

### 3B. Rastreio de quem deu check

**Mudancas no banco de dados**:
- Alterar coluna `steps` da tabela `client_checklists` para armazenar nao apenas `true/false`, mas tambem `user_id` e `timestamp` de quem marcou cada step
- Formato: `{ "step_id": { "done": true, "user_id": "uuid", "username": "joao", "at": "2026-02-09T..." } }`

**Mudancas na interface**:
- `src/components/ProcessChecklist.tsx`: Para admins, exibir ao lado de cada step quem deu o check e quando (ex: "Joao - 09/02 14:30")
- `src/hooks/useClientChecklist.ts`: Ao fazer toggle, incluir `user_id` e `username` do usuario logado nos dados salvos

---

## Detalhes Tecnicos

### Migracao SQL

```text
1. Criar enum app_role (admin, user)
2. Criar tabela profiles (id uuid PK -> auth.users, username text unique, display_name text)
3. Criar tabela user_roles (id uuid PK, user_id uuid -> auth.users, role app_role)
4. Criar funcao has_role() security definer
5. Trigger auto-criar profile no signup
6. Atualizar RLS de clients, client_checklists, melhorias para authenticated only
7. Criar RLS para profiles e user_roles
```

### Fluxo de autenticacao

```text
Login -> usuario digita "joao" e senha
       -> sistema converte para "joao@internal.app"
       -> autentica via Lovable Cloud auth
       -> carrega profile e role
       -> redireciona para dashboard
```

### Criacao do primeiro admin

- Sera necessario criar o primeiro usuario admin manualmente (via SQL ou uma tela de setup inicial)
- Apos isso, apenas admins podem criar novos usuarios e atribuir roles

### Ordem de implementacao

1. Migracao do banco (profiles, user_roles, RLS)
2. Pagina de login e hook de autenticacao
3. Protecao de rotas e contexto de auth
4. Controle de visibilidade financeira por role
5. Rastreio de usuario nos checks
6. Reconciliacao de datas dos checklists com a agenda

