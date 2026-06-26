
ALTER TABLE public.cash_expenses
ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';
