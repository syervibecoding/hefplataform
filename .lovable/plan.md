
# Plano: Corrigir Agenda + Excluir Usuarios

## Problema 1: Agenda nao persiste alteracoes

O calendario (`CalendarPage.tsx`) usa `dragOverrides` apenas em estado local (`useState`). Quando o usuario arrasta um evento para outro dia, a mudanca fica apenas na memoria e se perde ao trocar de pagina. Alem disso, a agenda do cliente (`agenda_certidoes`, `agenda_caixas_postais`) e salva como `ScheduleConfig` no banco -- nao como datas individuais. O drag-and-drop atual nao grava nada no banco.

**Solucao**: Ao soltar um evento em outro dia, gravar a mudanca no banco. Como a `ScheduleConfig` define regras (ex: "dia 15 de cada mes") e nao datas avulsas, a abordagem sera:

1. Adicionar um campo `overrides` (jsonb) nas colunas `agenda_certidoes` e `agenda_caixas_postais` da tabela `clients`, no formato:
   ```text
   { "overrides": { "2026-02": { "originalDay": 15, "newDay": 20 } } }
   ```
   Isso permite que o sistema saiba que, para fevereiro de 2026, o dia original 15 foi movido para o dia 20.

2. Atualizar `getScheduleDays` em `schedule-utils.ts` para aceitar overrides e aplicar as substituicoes.

3. No `CalendarPage.tsx`, ao fazer drop, chamar uma mutation que atualiza o campo de agenda do cliente no banco com o override do mes correspondente.

4. O `ProcessChecklist` ja recalcula as datas a partir do `schedule` -- entao, ao incluir os overrides no schedule, os checklists automaticamente refletem a mudanca.

5. O hook `useReconcileChecklists` ja cuida de mover registros orfaos para novas datas.

## Problema 2: Excluir usuarios (admin)

**Solucao**: Criar uma edge function `delete-user` que usa o service role key para chamar `supabaseAdmin.auth.admin.deleteUser()`. Na interface, adicionar um botao de exclusao na tabela de usuarios com confirmacao.

### Mudancas por arquivo

**Novo: `supabase/functions/delete-user/index.ts`**
- Recebe `{ user_id }` no body
- Valida que o chamador e admin (via token)
- Deleta o usuario com `auth.admin.deleteUser()`
- As tabelas `profiles` e `user_roles` devem ter cascade ou serao limpas manualmente

**`src/pages/UsersPage.tsx`**
- Adicionar coluna "Acoes" na tabela
- Botao de excluir com dialog de confirmacao (`AlertDialog`)
- Chamar a edge function `delete-user`
- Impedir que o admin exclua a si mesmo
- Refetch apos exclusao

**`src/pages/CalendarPage.tsx`**
- No `handleDrop`, chamar mutation para salvar override no campo de agenda do cliente no banco
- Remover dependencia exclusiva do estado local para overrides
- Carregar overrides existentes do banco ao montar

**`src/lib/schedule-utils.ts`**
- `getScheduleDays` aceitar parametro opcional `overrides` e aplicar substituicoes de dia

**`src/hooks/useClients.ts`**
- Garantir que `agendaCertidoes` e `agendaCaixasPostais` carregam os overrides corretamente

**Migracao SQL**
- Adicionar `ON DELETE CASCADE` nas foreign keys de `user_roles` e garantir que o `handle_new_user` trigger esta ativo para limpeza automatica

### Detalhes tecnicos

```text
Edge Function delete-user:
  POST { user_id: string }
  -> Verifica auth do chamador
  -> supabaseAdmin.auth.admin.deleteUser(user_id)
  -> Limpa profiles e user_roles manualmente (ou via cascade)
  -> Retorna { success: true }

Formato de overrides na agenda:
  agenda_certidoes = {
    dias: [15],
    overrides: {
      "2026-02": { "15": 20 }  // dia 15 movido para dia 20 em fev/2026
    }
  }

getScheduleDays(config, year, month):
  1. Calcula dias normais
  2. Se config.overrides?.[`${year}-${month+1}`] existir, substitui dias
  3. Retorna dias finais
```
