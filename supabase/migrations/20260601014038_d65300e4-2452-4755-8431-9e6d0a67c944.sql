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
CREATE INDEX idx_consultoria_slots_client ON public.consultoria_slots(client_id);
CREATE INDEX idx_consultoria_slots_consultant ON public.consultoria_slots(consultant_id);