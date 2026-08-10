CREATE TABLE public.material_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT '#8b5cf6',
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_folders TO authenticated;
GRANT ALL ON public.material_folders TO service_role;

ALTER TABLE public.material_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "material_folders_select" ON public.material_folders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "material_folders_insert" ON public.material_folders
  FOR INSERT TO authenticated WITH CHECK (public.is_internal_team());
CREATE POLICY "material_folders_update" ON public.material_folders
  FOR UPDATE TO authenticated USING (public.is_internal_team());
CREATE POLICY "material_folders_delete" ON public.material_folders
  FOR DELETE TO authenticated USING (public.is_internal_team());

CREATE TRIGGER material_folders_updated_at BEFORE UPDATE ON public.material_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.materials
  ADD COLUMN folder_id uuid REFERENCES public.material_folders(id) ON DELETE SET NULL;