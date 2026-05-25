# Plano: Correção do agendamento + Nova role "Coordenador"

## 1. Bug: só aceita 1 dia no campo "Dias específicos do mês"

**Causa identificada** em `src/components/ScheduleInput.tsx`:

O componente tem um `useEffect` que reseta o texto local (`diasText`) toda vez que `value.dias` muda:
```ts
useEffect(() => {
  setDiasText((value.dias || []).join(", "));
}, [value.dias]);
```

Fluxo do bug ao digitar "5, 20":
1. Usuário digita `5` → parse → `dias=[5]` → onChange dispara
2. Pai atualiza `value.dias=[5]` → useEffect dispara → texto é reescrito como `"5"` (sem vírgula)
3. Vírgula recém-digitada é apagada, impossibilitando digitar o segundo número

**Correção**: remover o `useEffect` de sincronização (o estado local já é inicializado a partir de `value.dias` no `useState`). A sincronização externa não é necessária neste formulário — o texto local é a fonte de verdade enquanto o usuário digita. Os valores válidos continuam fluindo para o pai via `onChange`.

Arquivo: `src/components/ScheduleInput.tsx`

---

## 2. Nova role "Coordenador"

### 2.1 Banco de dados (migration)

Adicionar `'coordenador'` ao enum `app_role`:
```sql
ALTER TYPE public.app_role ADD VALUE 'coordenador';
```

Nenhuma alteração de tabela necessária — `user_roles` já suporta.

### 2.2 Permissões — escopo do Coordenador

| Capacidade | Admin | Coordenador | Usuário |
|---|---|---|---|
| Ver checklists de datas futuras | ✅ | ✅ | ❌ |
| Navegar para datas futuras (`canNext`) | ✅ | ✅ | ❌ |
| Editar/reordenar/excluir passos do checklist operacional | ✅ | ✅ | ❌ |
| Adicionar passos locais ao checklist | ✅ | ✅ | ❌ |
| Ver dados financeiros (faturamento, contrato, custo API) | ✅ | ❌ | ❌ |
| Gestão de usuários (UsersPage) | ✅ | ❌ | ❌ |
| Gestão de produtos (criar/editar/excluir na sidebar) | ✅ | ❌ | ❌ |
| Gestão de materiais (criar/editar/excluir) | ✅ | ❌ | ❌ |
| Workflow / colunas de planejamento (admin actions) | ✅ | ❌ | ❌ |

Resumo: **Coordenador = poderes operacionais sobre checklists, sem acesso a finanças, usuários, produtos ou materiais.**

### 2.3 AuthContext (`src/contexts/AuthContext.tsx`)

- Atualizar tipo: `AppRole = "admin" | "coordenador" | "user"`
- Adicionar derivação: `isCoordenador = role === "coordenador"`
- Adicionar derivação: `canEditChecklist = isAdmin || isCoordenador` (exposta no contexto para uso fácil)

### 2.4 Componentes afetados

**`src/components/ProcessChecklist.tsx`** — trocar `isAdmin` por `canEditChecklist` em:
- `canNext` (navegação para datas futuras)
- `draggable` (reordenação)
- Botões editar/excluir passos
- Adicionar novo passo
- Mostrar quem completou (`username`) — manter como `isAdmin || isCoordenador`

**`src/pages/DashboardPage.tsx`** — para `useTodayChecklists` permitir coordenador também:
- `useTodayChecklists(hefsysActiveClients, (isAdmin || isCoordenador) && isHefsys)`
- Bloco de checklists pendentes visível para coordenador
- **Manter `financialOverview` somente para `isAdmin`**

**Não alterar** (continuam restritos a admin):
- `UsersPage`, `MaterialsPage`, `WorkflowPage` (admin actions), `ClientsPage` (valores), `ClientDetailPage` (financeiro), `Sidebar` (CRUD de produtos)

### 2.5 UI de gestão de usuários (`src/pages/UsersPage.tsx`)

- Permitir admin selecionar role ao criar usuário: dropdown com opções `user`, `coordenador`, `admin`
- Mostrar a role atual de cada usuário na listagem
- Permitir admin alterar role de um usuário existente

### 2.6 Edge function `supabase/functions/create-user/index.ts`

- Aceitar parâmetro opcional `role` (default `'user'`)
- Inserir em `user_roles` com a role recebida

### 2.7 RLS — revisão

As policies atuais usam `has_role(auth.uid(), 'admin')`. Como coordenador **não** deve ter acesso administrativo a tabelas tipo `products`, `materials`, `crm_stages`, etc., as policies existentes permanecem inalteradas.

Para edição de checklists, as policies de `client_checklists` já permitem qualquer usuário autenticado (`ALL` com `true`), então a restrição é puramente client-side — coordenador poderá editar normalmente via UI.

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/ScheduleInput.tsx` | Remover useEffect que reseta o texto |
| Nova migration | Adicionar `coordenador` ao enum `app_role` |
| `src/contexts/AuthContext.tsx` | Tipo + `isCoordenador` + `canEditChecklist` |
| `src/components/ProcessChecklist.tsx` | Trocar `isAdmin` → `canEditChecklist` onde apropriado |
| `src/pages/DashboardPage.tsx` | Habilitar checklists pendentes para coordenador |
| `src/pages/UsersPage.tsx` | Dropdown de role na criação + exibição/edição de role |
| `supabase/functions/create-user/index.ts` | Aceitar `role` no payload |
