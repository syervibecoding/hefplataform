# Plano: Checklist por dia + Agenda de Trafego Pago

## 1. Checklist dinamico por dia de consulta

### Situacao atual

Os passos do checklist sao globais por tipo (`certidoes` / `caixas_postais`). Quando o admin adiciona um passo, ele aparece em todos os dias de consulta de todos os clientes.

### Solucao

- Manter a tabela `checklist_steps` como **modelo padrao** (template)
- Armazenar passos extras (adicionados em um dia especifico) dentro do JSONB `steps` da tabela `client_checklists`, usando uma chave especial `_custom_steps`
- Formato: `{ "_custom_steps": [{ "id": "custom_xxx", "label": "Tarefa extra" }], "step_id_1": { done: true, ... } }`
- O botao "Adicionar processo" no `ProcessChecklist` passara a salvar o novo passo apenas no registro daquele periodo (dia) e cliente
- Os passos do template continuam aparecendo em todos os dias; passos customizados so aparecem no dia em que foram criados
- Possibilidade de arrastar o processo para mudar ordem 
- Conseguir editar o processo

### Arquivos alterados

- `**src/components/ProcessChecklist.tsx**`: Modificar para ler passos customizados do `client_checklists.steps._custom_steps`, exibir junto dos passos globais, e salvar novos passos apenas no registro do dia
- `**src/hooks/useClientChecklist.ts**`: Adicionar mutation para inserir/remover passos customizados no JSONB

---

## 2. Trafego Pago - Rotina de conferencia de conta de anuncio

### Solucao

Adicionar novos campos na tabela `clients` (via migracao SQL):

- `rotina_conferencia` (jsonb) - ScheduleConfig para quando conferir a conta de anuncio (ex: toda segunda, todos os dias)

### Exibicao na agenda

- O calendario (`CalendarPage`) atualmente so mostra clientes HefSys. Sera expandido para tambem exibir eventos de clientes de Trafego Pago
- Eventos de conferencia aparecerao com cor/estilo diferente e label como "Conferir Anuncios - [Nome do cliente]"

### Formularios

- `**AddClientDialog.tsx**` e `**EditClientDialog.tsx**`: Quando o produto ativo for `trafego`, mostrar o campo `ScheduleInput` para definir a rotina de conferencia

---

## 3. Trafego Pago - Alerta de saldo de campanha (PIX)

### Novos campos na tabela `clients`:

- `forma_pagamento` (text, default null) - "pix", "cartao", etc.
- `saldo_anuncio` (numeric, default 0) - valor colocado na conta de anuncio
- `gasto_diario_medio` (numeric, default 0) - media de gasto diario
- `data_deposito` (date, default null) - data do ultimo deposito

### Logica de alerta

- Calculo: `diasRestantes = saldo_anuncio / gasto_diario_medio`
- A partir de `data_deposito`, calcular em qual dia o saldo acaba
- Mostrar no calendario um evento de alerta (vermelho) no dia previsto para o saldo acabar
- Se o saldo acabar dentro de 3 dias, mostrar alerta visual tambem no dashboard

### Formularios

- Quando `product_id === "trafego"`, exibir:
  - Select para forma de pagamento (PIX / Cartao de Credito)
  - Se PIX: campos para saldo depositado, data do deposito, e media de gasto diario

---

## Detalhes tecnicos

### Migracao SQL

```text
ALTER TABLE clients ADD COLUMN rotina_conferencia jsonb DEFAULT '{}';
ALTER TABLE clients ADD COLUMN forma_pagamento text DEFAULT NULL;
ALTER TABLE clients ADD COLUMN saldo_anuncio numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN gasto_diario_medio numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN data_deposito date DEFAULT NULL;
```

### Estrutura de custom_steps no JSONB

```text
client_checklists.steps = {
  "_custom_steps": [
    { "id": "custom_1739xxx", "label": "Verificar pendencia SEFAZ" }
  ],
  "uuid-step-global-1": { "done": true, "user_id": "...", "username": "...", "at": "..." },
  "custom_1739xxx": { "done": false }
}
```

### Arquivos modificados (resumo)


| Arquivo                               | Mudanca                                                  |
| ------------------------------------- | -------------------------------------------------------- |
| `src/components/ProcessChecklist.tsx` | Ler/adicionar/remover custom_steps por dia               |
| `src/hooks/useClientChecklist.ts`     | Mutations para custom steps no JSONB                     |
| `src/data/constants.ts`               | Novos campos em GenericClient (trafego)                  |
| `src/hooks/useClients.ts`             | Mapear novos campos do DB                                |
| `src/components/AddClientDialog.tsx`  | Campos de trafego (rotina, pagamento, saldo)             |
| `src/components/EditClientDialog.tsx` | Campos de trafego (rotina, pagamento, saldo)             |
| `src/pages/CalendarPage.tsx`          | Suportar eventos de trafego (conferencia + alerta saldo) |
| `src/pages/Index.tsx`                 | Passar clientes de trafego para CalendarPage             |
| `src/pages/ClientDetailPage.tsx`      | Exibir info de rotina e saldo para clientes trafego      |


### Ordem de implementacao

1. Migracao SQL (novos campos)
2. Checklist dinamico por dia (ProcessChecklist + useClientChecklist)
3. Formularios de trafego (Add/Edit dialogs)
4. Calendario expandido (CalendarPage com eventos de trafego + alertas)
5. Detail page atualizada para trafego