

# Separar Dias de Execucao por Tipo de Consulta (Certidoes vs Caixas Postais)

## Problema Atual

Hoje, o cliente HefSys tem um unico campo `dias_execucao` (ex: `[1, 15, 22]`) que se aplica a **todas** as consultas igualmente. Na realidade, certidoes e caixas postais sao executadas em dias diferentes:

- Certidoes: dias 1, 15, 22
- Caixas Postais: dias 5, 20

## Solucao

Substituir o campo unico `dias_execucao` por dois campos separados: `dias_certidoes` e `dias_caixas_postais`. Assim cada tipo de consulta tem seu proprio calendario.

## Mudancas

### 1. Migracao de Banco de Dados

Adicionar duas novas colunas na tabela `clients` e remover a antiga:

- `dias_certidoes integer[] DEFAULT '{}'` -- dias para consultas do tipo "certidao"
- `dias_caixas_postais integer[] DEFAULT '{}'` -- dias para consultas do tipo "caixa_postal"
- Migrar dados existentes de `dias_execucao` para ambas as colunas
- Remover coluna `dias_execucao`

### 2. Atualizar Tipos (`src/data/constants.ts`)

Substituir `diasExecucao: number[]` na interface `HefSysClient` por:
- `diasCertidoes: number[]`
- `diasCaixasPostais: number[]`

### 3. Atualizar Hook `useClients.ts`

Mapear as novas colunas `dias_certidoes` e `dias_caixas_postais` do banco para os campos do modelo.

### 4. Atualizar Formularios (Add e Edit Client)

Trocar o campo unico "Dias de Execucao" por dois campos separados:
- **Dias das Certidoes**: input para informar dias (ex: "1, 15, 22")
- **Dias das Caixas Postais**: input para informar dias (ex: "5, 20")

Cada campo so aparece se o cliente tiver consultas daquele tipo selecionadas.

### 5. Atualizar Calendario (`CalendarPage.tsx`)

A logica `eventsByDay` passa a mapear separadamente:
- Consultas tipo `certidao` usando `diasCertidoes`
- Consultas tipo `caixa_postal` usando `diasCaixasPostais`

Isso faz com que no dia 1 apareca apenas "CND Federal, CRF FGTS..." e no dia 5 apareca "ECAC Caixa Postal, DET..." corretamente.

### 6. Atualizar Detalhes do Cliente (`ClientDetailPage.tsx`)

Exibir os dias separados por tipo na pagina de detalhes.

## Resultado Esperado

- Ao adicionar/editar um cliente HefSys, voce define dias especificos para certidoes e dias especificos para caixas postais
- O calendario mostra corretamente quais consultas caem em quais dias
- Ajuste de final de semana continua funcionando independentemente para cada grupo

