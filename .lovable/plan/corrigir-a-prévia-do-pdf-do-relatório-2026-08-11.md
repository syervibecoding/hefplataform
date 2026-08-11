# Corrigir a prévia do PDF do relatório

A prévia dentro da plataforma mostra "Não foi possível renderizar a prévia". Essa mensagem vem do bloco de erro do componente de prévia, mas o erro real ainda não foi capturado — o primeiro passo é confirmá-lo antes de trocar a implementação.

## Etapa 1 — Capturar o erro real
Abrir a tela de Relatórios no navegador de teste, clicar em "Prévia do PDF" e ler o erro exato no console (falha ao carregar o worker do pdf.js, incompatibilidade da versão instalada com o dev server, ou erro na chamada de renderização).

## Etapa 2 — Aplicar a correção conforme o erro
Duas hipóteses prováveis, na ordem:

1. **O worker do pdf.js não carrega**: trocar a forma de carregar o worker para a build "legacy" e instanciá-lo pelo próprio bundler, em vez do import por URL usado hoje. Essa build é a recomendada para ambientes com transformação de módulos e cobre a maioria dos casos.
2. **Formato da chamada de renderização**: ajustar a chamada de render para o formato exigido pela versão instalada do pdf.js.

## Etapa 3 — Garantir que a prévia nunca fique "quebrada"
Mesmo com a renderização funcionando, adicionar uma saída segura:
- botão "Abrir PDF em nova aba" sempre visível na área de prévia, sem depender do visualizador embutido;
- estado de carregamento claro enquanto as páginas são desenhadas;
- em caso de falha, mostrar o motivo junto do botão de abrir em nova aba, em vez de uma área vazia.

## Etapa 4 — Validação
Verificar no navegador: abrir a prévia de um cliente com relatório, confirmar que as páginas aparecem desenhadas, editar um campo do relatório e confirmar que a prévia se atualiza sozinha.

## Detalhes técnicos
- Arquivos envolvidos: `src/components/PdfCanvasPreview.tsx` (renderização em canvas) e `src/components/ClientReportsTab.tsx` (botão e painel de prévia).
- Fonte do PDF: `clientReportPdfArrayBuffer` em `src/lib/clientReportPdf.ts` — sem mudanças no layout ou na identidade visual do PDF.
- O buffer é clonado antes de ir para o pdf.js, já que a biblioteca transfere (invalida) o ArrayBuffer original.