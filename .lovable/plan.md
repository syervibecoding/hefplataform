# Melhorias: criação de plataforma, relatório editável e PDF de marca

## 1. Vincular cliente já na criação da plataforma

Hoje, ao criar uma plataforma nova, não há como escolher o cliente de consultoria — o vínculo só é feito depois, editando.

- Na tela "Nova plataforma" entra um seletor de clientes de consultoria (busca + múltipla seleção), junto de categoria e status.
- Ao salvar, a plataforma já nasce vinculada aos clientes escolhidos, aparecendo no portal e no relatório deles.
- Ao editar uma plataforma existente, o mesmo seletor permite adicionar/remover clientes sem sair do diálogo.

## 2. Relatório: entregas com descrição

Na aba Relatórios, no modo de edição:

- Cada plataforma/entrega passa a ter, além do título e da data (já editáveis), um campo de **descrição do que foi feito**.
- Essa descrição aparece no PDF logo abaixo do nome da entrega.
- Itens manuais de linha do tempo também ganham descrição editável.
- Os chamados do mês continuam entrando automaticamente; quando um chamado estiver ligado a uma plataforma, ele é listado sob aquela entrega no relatório, mostrando o que foi resolvido no mês.

## 3. PDF com a identidade visual

Aguardando o manual de marca. Assim que você enviar, o gerador de PDF é refeito com logo, paleta, tipografia e estrutura de páginas conforme o manual (capa, cabeçalho/rodapé, cores das tabelas). Os itens 1 e 2 seguem antes, independentes disso.

## Detalhes técnicos

- `client_report_items` já tem a coluna `descricao`; basta expor no formulário e no gerador — sem mudança de schema.
- `PlatformEditDialog.tsx`: novo bloco de vínculo usando `useAllClients` (filtrando consultoria) e `clientIds` já aceito por `addProduct`; para edição, mutação de `lovable_product_clients` (insert/delete diff).
- `ClientReportsTab.tsx`: campo textarea por item chamando `saveItem` com `descricao`; agrupamento de chamados por `product_id` na montagem dos dados do PDF.
- `clientReportPdf.ts`: coluna/linha extra de descrição nas tabelas de plataformas e timeline.
