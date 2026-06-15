-- Add support fields to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS support_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS support_enabled BOOLEAN NOT NULL DEFAULT false;

-- Backfill support_slug for existing clients
UPDATE public.clients SET support_slug = encode(gen_random_bytes(9), 'base64')
  WHERE support_slug IS NULL;

-- Normalize slug (remove + / =, keep urlsafe)
UPDATE public.clients SET support_slug = replace(replace(replace(support_slug, '+', '-'), '/', '_'), '=', '')
  WHERE support_slug ~ '[+/=]';

-- Function + trigger to auto-generate slug
CREATE OR REPLACE FUNCTION public.generate_support_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.support_slug IS NULL OR NEW.support_slug = '' THEN
    NEW.support_slug := replace(replace(replace(encode(gen_random_bytes(9), 'base64'), '+', '-'), '/', '_'), '=', '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_support_slug_default ON public.clients;
CREATE TRIGGER clients_support_slug_default
  BEFORE INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.generate_support_slug();

-- ===== support_tickets =====
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.lovable_products(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'duvida', -- bug, ajuste, duvida, feature, outro
  prioridade TEXT NOT NULL DEFAULT 'normal', -- baixa, normal, alta, urgente
  status TEXT NOT NULL DEFAULT 'aberto', -- aberto, em_andamento, aguardando_cliente, resolvido, fechado
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  csat_rating SMALLINT,
  csat_comment TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_support_tickets_client ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- ===== support_ticket_messages =====
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL, -- 'cliente' | 'equipe'
  author_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_ticket_messages TO authenticated;
GRANT ALL ON public.support_ticket_messages TO service_role;

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage ticket messages"
  ON public.support_ticket_messages FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id);
