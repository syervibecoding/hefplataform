ALTER TABLE clients ADD COLUMN rotina_conferencia jsonb DEFAULT '{}';
ALTER TABLE clients ADD COLUMN forma_pagamento text DEFAULT NULL;
ALTER TABLE clients ADD COLUMN saldo_anuncio numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN gasto_diario_medio numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN data_deposito date DEFAULT NULL;