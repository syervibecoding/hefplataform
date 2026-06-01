## Problema
A sidebar tem altura fixa (`top-0 bottom-0`) mas nenhum container interno permite scroll. Em telas baixas (viewport atual 657px), Dashboard Geral + Fluxo de Caixa + seletor de produto + menu + usuários/configurações/logout não cabem, e os itens de baixo ficam cortados sem como rolar.

## Solução
Tornar a área central da sidebar rolável, mantendo header (logo) e footer (usuário/sair) fixos.

### Alterações em `src/components/Sidebar.tsx`
1. Envolver o bloco do meio (Product Selector + `<nav>` do menu + bloco Usuários/Configurações) num único container `flex-1 overflow-y-auto` com scroll fino.
2. Manter `<aside>` como flex column com header no topo e o bloco de perfil/logout fixo no rodapé (fora da área rolável), para o "Sair" ficar sempre visível.
3. Ajustar `<nav>` removendo `flex-1` (o scroll passa a ser do wrapper) e manter espaçamento atual.
4. Adicionar classe utilitária discreta para a scrollbar (ex.: `scrollbar-thin` via estilo inline simples ou apenas deixar default — sem nova dependência).

Sem mudanças em lógica, dados ou outros arquivos.