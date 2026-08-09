# Liberar o portal de chamados por link (um link por cliente)

## Como vai funcionar

Cada cliente recebe um link exclusivo (`/suporte/p/<código>`). Ao abrir, ele vê o nome da empresa dele, as plataformas cadastradas para ele e os chamados dele — nada de outro cliente. Não precisa de senha; o código do link é secreto e único.

O isolamento por cliente já existe e está correto: a página busca tudo pelo código do link, filtrando por cliente. O que falta é ligar o suporte e ter um lugar único para copiar os links.

## O que está bloqueando hoje

- Nenhum cliente está com o suporte ligado, então qualquer link enviado agora retorna "não encontrado". Os códigos de link já existem (22 clientes).
- As plataformas hoje estão vinculadas a 7 clientes: Diretriz (8), Correta (7), AGR (6), Methodus (4), Art Cont (3), PHM (1), Locus (1). Os demais clientes abririam o portal sem nenhuma plataforma listada.
- No portal, as plataformas só aparecem dentro do formulário de novo chamado — não há uma vitrine visível de "seus projetos".

## O que será feito

1. **Painel de liberação em massa** — nova aba "Portais" no Gerenciador de Plataformas, listando todos os clientes com: liga/desliga do suporte, quantas plataformas estão vinculadas, botão de copiar link e aviso quando o cliente não tem plataforma vinculada.
2. **Ligar o suporte** dos 7 clientes que já têm plataformas (feito pelo painel, um clique cada).
3. **Vitrine de plataformas no portal do cliente** — bloco no topo com os projetos dele (nome, descrição e botão "Abrir" quando houver URL publicada), e atalho para abrir chamado já com a plataforma selecionada.
4. **Estado vazio melhor** — se o cliente não tiver plataforma vinculada, o portal mostra aviso claro em vez de lista vazia, e o botão de abrir chamado continua funcionando (categoria geral).
5. **Verificação real** — abrir o link de um cliente no navegador e confirmar que aparecem só as plataformas dele, e que o link de outro cliente mostra um conjunto diferente.

## Detalhes técnicos

- `src/pages/SupportPage.tsx`: nova aba "Portais" com lista de `clients` (id, nome, support_slug, support_enabled) + contagem de `lovable_product_clients`; reutiliza a mutation `useClientSupportSettings` de `src/hooks/useSupport.ts`.
- `src/components/CompanySupportSection.tsx` permanece na ficha do cliente (mesma mutation), sem duplicar lógica.
- `supabase/functions/portal-get-tickets/index.ts` já devolve `products` a partir de `lovable_product_clients`; incluir `descricao` e `url_app` no select para a vitrine.
- `src/pages/PublicSupportPortal.tsx`: bloco "Suas plataformas" acima da lista de chamados, alimentado por `data.products`.
- Sem alteração de schema; a habilitação é um update em `clients.support_enabled` via UI.
