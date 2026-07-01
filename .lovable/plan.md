## Objetivo

Adicionar ao Dashboard Geral novos KPIs financeiros e um painel de alocação do resultado operacional em categorias customizáveis (ex.: Reserva, Capital de Giro, Infraestrutura, Bonificação), com % editáveis e persistidos no banco.

## Novos KPIs (linha do topo do Dashboard)

Calculados sobre o mês corrente:

- **Faturamento Bruto** — já existe como "Receita do Mês".
- **Impostos (Simples ~6%)** — alíquota configurável, padrão 6%.
- **Faturamento Líquido** = Bruto − Impostos.
- **Despesas do Mês** — já existe.
- **Resultado Operacional** = Líquido − Despesas.
- **Margem de Lucro** = Resultado / Bruto (%).

Cor verde quando positivo, vermelho quando negativo.

## Painel "Alocação do Resultado"

Card novo abaixo dos KPIs, ao lado (ou substituindo) o card de Investimentos atual:

- Mostra o Resultado Operacional do mês em destaque.
- Lista as categorias cadastradas com: nome, %, valor calculado (R$ = resultado × %).
- Barra horizontal empilhada com as fatias, mesma linguagem visual do painel "Despesas por Categoria".
- Botão **Gerenciar categorias** abre um dialog onde o usuário:
  - Adiciona / edita / remove categorias.
  - Define nome, % e cor (paleta pré-definida).
  - Vê a soma total das % com aviso se ≠ 100%.
- Se resultado for negativo, mostra os valores em vermelho e um aviso "Resultado negativo — nenhuma alocação aplicada".

## Configurações financeiras

Um único dialog "Configurações financeiras" (ícone de engrenagem no topo do dashboard) contendo:

- Campo **Alíquota de impostos** (%) — padrão 6%.
- Gerenciamento das categorias de alocação (mesmo componente do botão acima).

## Detalhes técnicos

### Banco (migration)

Duas tabelas em `public`, ambas restritas a admins:

```text
financial_settings
  id            uuid pk
  key           text unique   -- ex.: 'tax_rate'
  value         numeric
  updated_at    timestamptz

result_allocations
  id            uuid pk
  nome          text
  percentual    numeric        -- 0..100
  cor           text           -- classe tailwind ex.: 'bg-primary'
  ordem         int
  created_at, updated_at
```

RLS: SELECT/INSERT/UPDATE/DELETE apenas para usuários com role `admin` (via `has_role`). GRANT para `authenticated` e `service_role`. Trigger de `updated_at`.

Seed opcional: 4 linhas em `result_allocations` (Reserva 30, Capital de Giro 30, Infraestrutura 20, Bonificação 20) e 1 linha em `financial_settings` (`tax_rate = 6`).

### Frontend

- Novo hook `useFinancialSettings` (React Query) para ler/gravar `tax_rate`.
- Novo hook `useResultAllocations` para CRUD das categorias.
- Novo componente `ResultAllocationCard` (exibição) e `FinancialSettingsDialog` (gerenciamento).
- `GeneralDashboardPage.tsx` passa a calcular `impostos`, `liquido`, `resultado`, `margem` e renderiza a nova linha de KPIs + o card de alocação.

Nenhuma alteração de lógica em outras páginas. Somente `GeneralDashboardPage.tsx` e arquivos novos.
