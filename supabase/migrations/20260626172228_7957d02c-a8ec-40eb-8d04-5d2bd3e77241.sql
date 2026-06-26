
-- support_attachments
CREATE TABLE public.support_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.support_ticket_messages(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  uploaded_by_type text NOT NULL CHECK (uploaded_by_type IN ('cliente','equipe')),
  uploaded_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_attachments_ticket ON public.support_attachments(ticket_id);
CREATE INDEX idx_support_attachments_message ON public.support_attachments(message_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_attachments TO authenticated;
GRANT ALL ON public.support_attachments TO service_role;

ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal team manages attachments"
ON public.support_attachments FOR ALL TO authenticated
USING (public.is_internal_team())
WITH CHECK (public.is_internal_team());

CREATE POLICY "cliente reads own ticket attachments"
ON public.support_attachments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = support_attachments.ticket_id
      AND st.platform_company_id = public.get_my_platform_company_id()
  )
);

-- portal rate limits (service_role only)
CREATE TABLE public.portal_rate_limits (
  slug text NOT NULL,
  action text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slug, action)
);
GRANT ALL ON public.portal_rate_limits TO service_role;
ALTER TABLE public.portal_rate_limits ENABLE ROW LEVEL SECURITY;

-- storage policies: only internal team direct access; portal uses service role via edge functions
CREATE POLICY "internal team reads support attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'support-attachments' AND public.is_internal_team());

CREATE POLICY "internal team writes support attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'support-attachments' AND public.is_internal_team());

CREATE POLICY "internal team deletes support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'support-attachments' AND public.is_internal_team());
