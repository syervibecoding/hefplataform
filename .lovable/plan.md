# Plano: Responsividade Mobile (área interna + portal do cliente)

## Objetivo
Adaptar toda a plataforma para uso confortável em telas pequenas (≤768px), mantendo intacta a experiência desktop atual.

## Estratégia geral
- **Breakpoints Tailwind**: `sm` (640), `md` (768), `lg` (1024). Mobile-first: classes base = mobile, `md:`/`lg:` = desktop.
- **Sem mexer em lógica de negócio** — apenas layout/CSS/estrutura visual.
- **Sem mudar tokens de design** — manter tema escuro violeta/magenta, DM Sans, JetBrains Mono.

---

## 1. Navegação (sidebar → drawer)

**`src/components/Sidebar.tsx`**
- Manter o `<aside>` desktop (`hidden md:flex`).
- Em mobile, mover o mesmo conteúdo para dentro de um `Sheet` (shadcn) que abre a partir do botão hambúrguer da Topbar.
- Extrair o JSX interno do sidebar para um sub-componente `SidebarContent` para reuso entre o aside e o sheet.

**`src/components/Topbar.tsx`**
- Adicionar botão hambúrguer (`Menu` icon) visível só em `<md`.
- Padding responsivo: `px-4 md:px-8`.
- Título com `text-base md:text-xl`.
- Receber prop `onOpenMenu: () => void`.

**`src/pages/Index.tsx`**
- Estado `mobileMenuOpen` controlando o Sheet.
- `<main>` muda de `ml-60` para `md:ml-60` (sem margem em mobile).
- Padding do conteúdo: `p-4 md:p-7`.
- Fechar o drawer automaticamente ao navegar (`onNavigate` no SidebarContent).

---

## 2. Topbar do Portal do Cliente

**`src/pages/ClientPortalPage.tsx`**
- Header com logo + nome empresa + botão sair: empilhar em mobile (`flex-col sm:flex-row`), reduzir paddings.
- Botão "Novo ticket" passa a ocupar largura total em mobile.
- Lista de tickets / detalhe: layout em coluna única em mobile; em desktop manter master-detail lado a lado.
- Inputs e textarea já são responsivos por padrão — só ajustar wrappers com `gap`/`padding` menores.

---

## 3. Tabelas (scroll horizontal)

Aplicar o mesmo padrão em todas as tabelas grandes:
```tsx
<div className="overflow-x-auto -mx-4 md:mx-0">
  <div className="min-w-[800px] md:min-w-0">
    <table>...</table>
  </div>
</div>
```

Arquivos afetados (revisão visual + wrapper de scroll):
- `src/pages/ClientsPage.tsx`
- `src/pages/CashFlowPage.tsx` + `CashFlowDayDetail.tsx`
- `src/pages/UsersPage.tsx`
- `src/pages/MaterialsPage.tsx`
- `src/pages/LovableProductsPage.tsx`
- `src/pages/MelhoriasPage.tsx`
- `src/pages/SupportPage.tsx`
- `src/components/PlataformasTab.tsx`, `ClientesAcessosTab.tsx`
- `src/components/RenewalPipelineBoard.tsx`
- `src/components/ConsultoriaSlotsManager.tsx`

---

## 4. Grids, cards e páginas

Padrão geral a aplicar:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4` em todas as grids de StatCard, lista de clientes em cards, etc.
- `flex-col md:flex-row` em headers de páginas com título + ações.
- `text-2xl md:text-3xl` em títulos grandes.
- Botões "Novo X" viram `w-full md:w-auto` em headers.
- Diálogos (`Dialog`): adicionar `max-h-[90vh] overflow-y-auto` e `w-[calc(100vw-2rem)] sm:max-w-md` para evitar estouro.

Páginas a passar:
- `HomePage`, `DashboardPage`, `GeneralDashboardPage`, `OperacionalPage`
- `ConsultoriaPage`, `ConsultoriaReportPage`
- `CRMPage` (Kanban: scroll horizontal das colunas em mobile)
- `CalendarPage` (modo lista em <md, grid em ≥md)
- `WorkflowPage`, `MelhoriasPage`
- `ClientDetailPage` (tabs e blocos de info em coluna única)
- `LoginPage` (já costuma ser simples; revisar padding)

---

## 5. Componentes auxiliares

- `StatCard`: padding interno menor em mobile (`p-4 md:p-6`).
- `InteractionTimeline`, `ProcessChecklist`: revisar gap/padding.
- Diálogos `AddClientDialog`, `EditClientDialog`, `CashEntryDialog`, `CashExpenseDialog`, `SupportTicketDialog`, `PlatformEditDialog`, `ConsultantManagerDialog`, `InvestmentsManagerDialog`, `CashFlowSettingsDialog`, `DeleteClientDialog`: ajuste de largura responsiva e scroll vertical.

---

## 6. Detalhes técnicos

- Hook existente `useIsMobile` (`src/hooks/use-mobile.tsx`) pode ser usado onde precisarmos de lógica condicional (ex.: trocar Sidebar fixa por Sheet, modo lista vs grid no calendário).
- Adicionar meta viewport em `index.html` se ainda não existir (`width=device-width, initial-scale=1`).
- Nenhuma migração de DB, nenhum hook de dados alterado.

---

## Entrega
Implementação em ordem:
1. Shell (Sidebar → Sheet, Topbar com hambúrguer, Index com margem responsiva).
2. Portal do cliente.
3. Tabelas com wrapper de scroll horizontal.
4. Grids/cards das páginas internas.
5. Diálogos.
6. Verificação visual no preview em 393px.
