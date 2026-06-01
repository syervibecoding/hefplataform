## Objetivo

Quando o produto ativo for **Consultoria IA**, mostrar um calendário no mesmo formato do calendário do HefSys, mas com a visão dos turnos (manhã/tarde) de cada consultor. Cada cliente de consultoria fecha 1 ou 2 turnos recorrentes (ex: "toda terça de manhã com Bruno") e a agenda é preenchida automaticamente.

## O que vamos construir

### 1. Cadastro de consultores
- Tabela `consultants` (linkada a `profiles.id`) com cor de exibição.
- Tela admin simples para marcar quais usuários são consultores (em Usuários ou um botão "Gerenciar consultores" no topo do calendário).
- Inicialmente os 3 consultores: você, Syer e Bruno.

### 2. Slot recorrente no contrato do cliente
No cadastro/edição de cliente de consultoria, novos campos:
- **Turnos contratados** (1 ou 2 slots), cada slot com:
  - Consultor responsável
  - Dia da semana (Seg–Sex)
  - Turno (Manhã / Tarde)
  - Data de início (opcional, default = `data_inicio` do cliente)

Esses slots geram automaticamente as sessões mensais no calendário, do jeito que o HefSys já faz com agendas recorrentes.

### 3. Calendário de Consultoria (nova view)
- Mesma página `CalendarPage`, novo modo quando `activeProduct === "consultoria-clix"`.
- Cada célula de dia mostra dois sub-blocos: **Manhã** e **Tarde**.
- Dentro de cada turno: pílulas coloridas com `Consultor · Cliente`, pintadas com a cor do consultor.
- Filtro topo: "Todos / Eu / Syer / Bruno" para ver só a agenda de um consultor.
- Clique no dia abre o painel lateral existente com a lista detalhada.
- Sessões pontuais (remarcação) ficam fora do escopo desta entrega; só a recorrência do contrato.

### 4. Detalhe do cliente
Na página do cliente de consultoria, nova seção **Próximas sessões** (lista) + **Histórico** (lista), geradas a partir dos slots recorrentes do contrato, com data, turno e consultor.

## Detalhes técnicos

### Banco (migração nova)
```sql
-- Consultores: marca quais profiles atendem
CREATE TABLE public.consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  cor text NOT NULL DEFAULT 'bg-primary/20 text-primary border-primary/30',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultants TO authenticated;
GRANT ALL ON public.consultants TO service_role;
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read consultants" ON public.consultants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage consultants" ON public.consultants FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Slots recorrentes vinculados ao cliente de consultoria
CREATE TABLE public.consultoria_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  consultant_id uuid NOT NULL,
  dia_semana smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  turno text NOT NULL CHECK (turno IN ('manha','tarde')),
  data_inicio date,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultoria_slots TO authenticated;
GRANT ALL ON public.consultoria_slots TO service_role;
ALTER TABLE public.consultoria_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage slots" ON public.consultoria_slots FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

### Front
- `src/hooks/useConsultants.ts` — CRUD lista de consultores (com `display_name` via join em profiles).
- `src/hooks/useConsultoriaSlots.ts` — CRUD slots por cliente + leitura global (para o calendário).
- `CalendarPage.tsx`: novo branch `isConsultoriaView`, gera `eventsByDay` expandindo cada slot pelos dias do mês que caem no `dia_semana`, com `turno` e cor do consultor.
- `AddClientDialog` / `EditClientDialog`: quando `product_id === "consultoria-clix"`, mostrar bloco "Turnos contratados" com até 2 linhas (consultor + dia da semana + turno).
- `ClientDetailPage`: seção "Próximas sessões" / "Histórico" para consultoria.
- Pequeno gerenciador de consultores em `UsersPage` (toggle "É consultor" + seletor de cor).

## Fora do escopo
- Remarcação/sessão avulsa (pode vir numa segunda iteração).
- Bloqueio de conflito entre slots no mesmo turno/consultor (apenas aviso visual se ocorrer).
- Notificações.