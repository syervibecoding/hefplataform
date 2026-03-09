
-- Planning columns (dynamic kanban columns)
CREATE TABLE public.planning_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  color text NOT NULL DEFAULT 'bg-blue-500/15 text-blue-600',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage planning_columns" ON public.planning_columns FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read planning_columns" ON public.planning_columns FOR SELECT TO authenticated
  USING (true);

-- Planning tasks
CREATE TABLE public.planning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  column_id uuid REFERENCES public.planning_columns(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL DEFAULT 0,
  priority text NOT NULL DEFAULT 'media',
  assigned_to uuid,
  due_date date,
  labels text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access planning_tasks" ON public.planning_tasks FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default columns
INSERT INTO public.planning_columns (label, color, position) VALUES
  ('Plano Semanal', 'bg-blue-500/15 text-blue-600', 0),
  ('Fazendo', 'bg-amber-500/15 text-amber-600', 1),
  ('Aguardando Cliente', 'bg-orange-500/15 text-orange-600', 2),
  ('Pausa', 'bg-slate-500/15 text-slate-500', 3),
  ('Feito', 'bg-emerald-500/15 text-emerald-600', 4);
