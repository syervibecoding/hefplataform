

# Consultas Customizadas por Cliente (HefSys)

## Problema

Atualmente, os tipos de consulta do HefSys sao fixos (Certidoes e Caixas Postais). Alguns clientes precisam de consultas exclusivas (ex: "Credenciamento" para AGR) com agenda propria e checklist diario.

## Solucao

Criar um sistema de **consultas extras** por cliente, onde cada consulta extra tem seu proprio nome, agenda e checklist independente.

### Como funciona

1. No formulario de adicionar/editar cliente HefSys, o admin pode adicionar "Consultas Extras" com nome customizado e agenda propria
2. Na pagina de detalhe do cliente, cada consulta extra aparece como um checklist separado (igual aos de Certidoes e Caixas Postais)
3. Os checklists das consultas extras reutilizam toda a infraestrutura existente (`client_checklists`, `ProcessChecklist`), usando um `tipo` dinamico (ex: `custom_credenciamento_agr`)
4. Para o caso do Credenciamento diario, basta configurar a agenda com `diaSemana` para cada dia util, ou `dias: [1,2,3,...,31]`

### Exemplo pratico (AGR - Credenciamento)

- Admin edita o cliente AGR
- Na secao "Consultas Extras", clica "Adicionar Consulta"
- Nome: "Credenciamento"
- Agenda: configura como "Todos os dias uteis" (segunda a sexta)
- Salva. Agora na pagina de detalhe do AGR aparece um terceiro checklist "Credenciamento" com navegacao por dia, igual aos outros

## Mudancas no banco de dados

Nova coluna `consultas_extras` (JSONB) na tabela `clients`:

```text
consultas_extras: [
  {
    "id": "custom_1234",
    "nome": "Credenciamento",
    "agenda": { "diaSemana": 1 }  // ou dias especificos
  }
]
```

Tambem precisamos expandir o tipo `ChecklistTipo` no codigo para aceitar strings dinamicas (ja que `client_checklists.tipo` e TEXT no banco).

## Mudancas na agenda

Adicionar uma nova opcao de agenda: **"Todos os dias uteis (Seg-Sex)"** no componente `ScheduleInput`, que gera a config `{ todosOsDiasUteis: true }`. O `getScheduleDays` sera atualizado para gerar todos os dias uteis do mes quando essa flag estiver ativa.

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/migrations/...` | Adicionar coluna `consultas_extras` (JSONB, default `'[]'`) na tabela `clients` |
| `src/data/constants.ts` | Adicionar campo `consultasExtras` ao tipo `HefSysClient` |
| `src/hooks/useClients.ts` | Mapear `consultas_extras` no cliente |
| `src/hooks/useClientChecklist.ts` | Aceitar tipo dinamico (string ao inves de union restrita) |
| `src/lib/schedule-utils.ts` | Suporte a `todosOsDiasUteis` no `getScheduleDays` |
| `src/components/ScheduleInput.tsx` | Nova opcao "Todos os dias uteis" |
| `src/components/AddClientDialog.tsx` | Secao para adicionar consultas extras com nome + agenda |
| `src/components/EditClientDialog.tsx` | Mesma secao de consultas extras |
| `src/pages/ClientDetailPage.tsx` | Renderizar um `ProcessChecklist` para cada consulta extra |
| `src/pages/CalendarPage.tsx` | Exibir datas das consultas extras no calendario |

## Detalhes Tecnicos

### Estrutura da consulta extra

```text
interface ConsultaExtra {
  id: string;          // "custom_" + timestamp
  nome: string;        // Ex: "Credenciamento"
  agenda: ScheduleConfig;  // Mesma estrutura de agenda existente
}
```

### ChecklistTipo expandido

O tipo `ChecklistTipo` passa de `"certidoes" | "caixas_postais"` para `string`, permitindo valores como `"custom_credenciamento_1234"`. A coluna `tipo` na tabela `client_checklists` ja e TEXT, entao nao precisa de mudanca no banco para isso.

### Checklist steps para consultas extras

Como as consultas extras sao especificas por cliente, nao usam os `checklist_steps` globais (templates). O admin adiciona steps customizados diretamente via o botao "Adicionar processo" que ja existe no `ProcessChecklist`. Alternativamente, podemos permitir definir steps default na propria consulta extra.

### ScheduleInput - nova opcao

Adicionar um toggle/checkbox "Todos os dias uteis (Seg-Sex)" que quando ativado, gera todos os dias uteis do mes automaticamente no `getScheduleDays`.

### Fluxo do usuario

```text
1. Admin vai em Clientes > AGR > Editar
2. Rola ate "Consultas Extras"
3. Clica "+ Adicionar Consulta Extra"
4. Preenche: Nome = "Credenciamento", Agenda = "Todos os dias uteis"
5. Salva
6. Volta ao detalhe do AGR
7. Agora aparece: Checklist Certidoes | Checklist Caixas | Checklist Credenciamento
8. O checklist Credenciamento aparece todo dia util com navegacao por data
9. Admin adiciona os steps especificos desse processo via "Adicionar processo"
```

