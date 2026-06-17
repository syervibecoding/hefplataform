
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS last_team_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_client_read_at timestamptz;

ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
