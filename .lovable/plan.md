# Menu editável + Relatório/PDF editável

Duas frentes: deixar os nomes do menu configuráveis pelo admin e permitir editar o conteúdo do relatório do cliente antes de exportar o PDF.

## 1. Menu dinâmico (renomear itens)

Hoje os itens do menu ("Materiais", "Gerenciador de Plataformas", "CRM", "Melhorias", etc.) estão fixos no código.

- Nova tabela `nav_items` no banco: chave interna da página, rótulo, ícone, posição, visível sim/não e se é só para admin.
- Carga inicial com os itens atuais (Início, Clientes, Calendário, Materiais, Gerenciador de Plataformas, CRM, Melhorias, Assistente, Importações, Usuários, Configurações).
- A barra lateral passa a ler essa tabela; o título no topo da página também usa o mesmo rótulo (hoje há uma lista fixa no componente de topo).
- Admin edita direto na barra lateral (ícone de lápis ao passar o mouse) ou em Configurações: nome, ícone, ordem e ocultar item.
- Só admin edita; usuários comuns apenas visualizam.

## 2. Relatório do cliente editável (com reflexo no PDF)

Na aba Relatórios do Gerenciador de Plataformas:

- Nova tabela `client_report_settings` (por cliente): título do relatório, subtítulo, data de referência/período, texto de introdução e texto de conclusão.
- Modo "Editar relatório": campos de texto e datas editáveis na tela, salvos no banco.
- Linha do tempo editável: renomear o título de cada evento, ajustar a data exibida, adicionar item manual e ocultar itens que não devem sair no PDF (salvo em `client_report_items`, sem alterar os dados de origem como chamados e plataformas).
- Plataformas entregues: permitir ajustar a data de entrega exibida e ocultar itens do PDF.
- O gerador de PDF passa a receber esses textos, datas e itens já editados — o PDF vira o espelho exato do que está na tela.

## Detalhes técnicos

- Tabelas novas: `nav_items`, `client_report_settings`, `client_report_items` — com RLS: leitura para autenticados, escrita apenas para admin (`has_role`), e GRANTs correspondentes.
- Novos hooks React Query: `useNavItems`, `useClientReportSettings`.
- Alterações: `src/components/Sidebar.tsx`, `src/components/Topbar.tsx`, `src/components/ClientReportsTab.tsx`, `src/lib/clientReportPdf.ts`.
- Fallback: se a tabela `nav_items` estiver vazia, o menu usa a lista atual em código, evitando tela vazia.

## Ordem de execução

1. Migração das três tabelas + carga inicial do menu.
2. Menu dinâmico (barra lateral + título da página + edição pelo admin).
3. Edição do relatório na tela.
4. PDF consumindo o conteúdo editado.