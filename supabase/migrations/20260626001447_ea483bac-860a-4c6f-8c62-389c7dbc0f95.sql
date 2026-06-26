
CREATE TABLE public.assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_conversations TO authenticated;
GRANT ALL ON public.assistant_conversations TO service_role;

ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all assistant conversations"
  ON public.assistant_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert own assistant conversations"
  ON public.assistant_conversations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can update own assistant conversations"
  ON public.assistant_conversations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can delete assistant conversations"
  ON public.assistant_conversations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_assistant_conversations_updated_at
  BEFORE UPDATE ON public.assistant_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_assistant_conversations_updated_at
  ON public.assistant_conversations (updated_at DESC);
