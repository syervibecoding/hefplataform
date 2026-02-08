

# Reestruturar Plataforma por Produtos + Adicionar Novo Cliente

## Resumo

A plataforma vai ser reorganizada para funcionar dividida por **4 produtos da Clix**, cada um com seus clientes e dashboard independentes. Tambem vamos implementar o formulario funcional de "Novo Cliente" em cada produto.

## Estrutura de Produtos

| Produto | Descricao |
|---|---|
| **HefSys** | Contabilidade (produto atual, ja tem dados e logica de consultas/CNPJs) |
| **Trafego Pago** | Agencia de marketing digital |
| **Automacao com IA** | Solucoes de automacao |
| **Plataformas com IA** | Desenvolvimento de plataformas com IA |

## O que muda na interface

1. **Sidebar** ganha um seletor de produto no topo (abaixo do logo), permitindo alternar entre os 4 produtos. O menu abaixo se adapta ao produto selecionado.

2. **Dashboard, Clientes e demais paginas** ficam contextualizados ao produto ativo. Cada produto tem sua propria lista de clientes.

3. **Formulario "Novo Cliente"** - Um modal/dialog funcional ao clicar no botao "+ Novo Cliente" com campos:
   - Nome da empresa
   - Contato (nome da pessoa)
   - WhatsApp
   - Email
   - Status (ativo/inativo)
   - **Campos especificos do HefSys**: CNPJs, consultas, frequencia, dias de execucao
   - Para os demais produtos: apenas os campos basicos por enquanto

## Detalhes Tecnicos

### 1. Atualizar `src/data/constants.ts`
- Adicionar tipo `Product` com id, nome e icone
- Adicionar array `PRODUCTS` com os 4 produtos
- Criar interface `BaseClient` com campos compartilhados (nome, contato, whatsapp, email, status)
- Manter `Client` (HefSys) extendendo `BaseClient` com campos especificos (cnpjs, consultas, frequencia, diasExecucao)
- Criar `GenericClient` extendendo `BaseClient` para os demais produtos (campos basicos + valor do contrato)
- Adicionar dados iniciais de exemplo para os outros produtos

### 2. Atualizar `src/components/Sidebar.tsx`
- Adicionar seletor de produto (dropdown ou lista com icones) entre o logo e o menu
- Passar `activeProduct` e `onChangeProduct` como props
- Adaptar label do menu conforme produto

### 3. Criar `src/components/AddClientDialog.tsx`
- Modal usando Radix Dialog
- Formulario com react-hook-form + zod para validacao
- Campos condicionais: se produto = hefsys, mostra campos extras (CNPJs, consultas com checkboxes, frequencia, dias)
- Para demais produtos: campos basicos + valor mensal do contrato

### 4. Atualizar `src/pages/Index.tsx`
- Adicionar state `activeProduct` (default: "hefsys")
- Separar listas de clientes por produto
- Funcao `addClient` para adicionar cliente ao estado do produto ativo
- Passar produto ativo para componentes filhos

### 5. Atualizar `src/pages/ClientsPage.tsx`
- Receber `activeProduct` como prop
- Adaptar colunas da tabela conforme produto (HefSys mostra CNPJs/consultas, outros mostram valor do contrato)
- Integrar o dialog de novo cliente

### 6. Atualizar `src/pages/DashboardPage.tsx`
- Adaptar metricas conforme produto ativo
- HefSys: manter metricas atuais (CNPJs, consultas, custo API)
- Outros: metricas basicas (total clientes, receita, etc.)

### 7. Atualizar `src/pages/ClientDetailPage.tsx`
- Adaptar exibicao conforme tipo de cliente/produto

