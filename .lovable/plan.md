# Gerenciador de Plataformas na aba "Produtos" + carga das 40 plataformas

## 1. Navegação
A aba **Produtos** (sidebar) passa a abrir o **Gerenciador de Plataformas** (Plataformas / Chamados / Clientes & Acessos), em vez da antiga tela de Produtos Lovable. O atalho da Home continua indo para o mesmo lugar, sem página duplicada.

## 2. Cadastro das plataformas
Hoje a tabela de plataformas está vazia. Serão cadastradas as 40 plataformas da lista, cada uma com:
- Nome e descrição
- Categoria = cliente/linha (AGR, Art Conta, Correta, Diretriz, Methodus, Outros)
- URL publicada (quando existir) e o link do projeto Lovable na lista de links
- Status: "ativo" quando publicada, "protótipo" quando não publicada

## 3. Vínculo com os clientes de Consultoria de IA
Cada plataforma é vinculada ao cliente correspondente já cadastrado na consultoria:
- AGR CONTÁBIL — 6 plataformas (itens 1 a 6)
- Art Cont — 3 (itens 8, 9, 10)
- Correta Contabilidade — 7 (itens 11 a 17)
- Diretriz Contabilidade — 8 (itens 18 a 25)
- Methodus Contabilidade — 4 (itens 26 a 29)
- PHM — 1 (item 30)
- Locus Contábil — 1 (item 34)

Sem vínculo de cliente (produtos internos/pontuais): Mainha Me Ensina, Consultoria IA Contábil/Fiscal, Conversor de Ponto JCP, Consulta Dívida Ativa, Totalizador NF-e, Client Intelligence Dashboard, ICMS Fronteira PE, Comunicação GLA e o Hef Showcase.

Clientes sem plataformas na lista (Advice, Lucro Azul) ficam sem vínculo por enquanto.

## Detalhes técnicos
- `Index.tsx`: rota `lovable-products` renderiza `SupportPage`; `LovableProductsPage` deixa de ser usada (arquivo removido).
- Sidebar: item "Produtos" mantém o rótulo/ícone atual apontando para o gerenciador.
- Carga de dados: inserts em `lovable_products` (com `links` contendo o projeto Lovable) e em `lovable_product_clients` usando os IDs dos clientes de `consultoria-clix`. Sem alteração de schema.
