ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS valor_implementacao numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_implementacao date,
  ADD COLUMN IF NOT EXISTS tem_mensalidade boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_mensalidade numeric DEFAULT 0;