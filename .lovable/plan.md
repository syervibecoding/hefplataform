

# Navegacao Mensal nos Checklists

O sistema de checklists ja e recorrente/mensal -- cada mes gera um registro independente na tabela `client_checklists` com o campo `periodo` (ex: "2026-02"). Os checks do mes atual nao interferem nos de meses anteriores.

O que sera adicionado e a **navegacao entre meses**, para que voce possa:
- Ver o progresso do mes atual (ja funciona)
- Navegar para meses anteriores e ver o historico
- Saber claramente qual mes esta sendo exibido

## Mudancas

### 1. Componente ProcessChecklist (src/components/ProcessChecklist.tsx)
- Adicionar um seletor de periodo (mes/ano) com botoes de navegacao (anterior / proximo)
- Exibir o mes/ano atual de forma clara no cabecalho (ex: "Fevereiro 2026")
- Bloquear navegacao para meses futuros

### 2. Sem mudancas no banco de dados
A estrutura da tabela `client_checklists` ja suporta multiplos periodos por cliente/tipo. Nenhuma migracao necessaria.

## Detalhes Tecnicos
- O componente `ProcessChecklist` passara a manter um estado local `periodo` (iniciando com o mes atual)
- Ao navegar entre meses, o hook `useClientChecklist` sera chamado com o novo periodo, buscando automaticamente o registro correspondente
- Meses sem registro mostrarao o checklist vazio (todos os steps desmarcados), permitindo preenchimento retroativo se necessario

