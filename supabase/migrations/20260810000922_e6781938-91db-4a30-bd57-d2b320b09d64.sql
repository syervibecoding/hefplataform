ALTER TABLE public.client_report_settings ADD COLUMN IF NOT EXISTS periodo_ref text NOT NULL DEFAULT to_char(now(), 'YYYY-MM');
ALTER TABLE public.client_report_items ADD COLUMN IF NOT EXISTS periodo_ref text NOT NULL DEFAULT to_char(now(), 'YYYY-MM');

ALTER TABLE public.client_report_settings DROP CONSTRAINT IF EXISTS client_report_settings_client_id_key;
ALTER TABLE public.client_report_items DROP CONSTRAINT IF EXISTS client_report_items_client_id_item_key_key;

ALTER TABLE public.client_report_settings ADD CONSTRAINT client_report_settings_client_periodo_key UNIQUE (client_id, periodo_ref);
ALTER TABLE public.client_report_items ADD CONSTRAINT client_report_items_client_periodo_item_key UNIQUE (client_id, periodo_ref, item_key);