# Fix: erro ao adicionar cliente (gen_random_bytes não existe)

## Causa
O POST em `/clients` está retornando 404 com:
```
function gen_random_bytes(integer) does not exist
```

Esse erro vem do trigger `generate_support_slug` (em `clients`), que usa `gen_random_bytes(9)` da extensão `pgcrypto`. A extensão não está habilitada (ou não está no `search_path`), então qualquer INSERT em `clients` quebra — incluindo o fluxo de "reaproveitar cliente existente".

Não é bug do reaproveitamento — qualquer cadastro novo de cliente está quebrado.

## Correção

Migration única que reescreve `public.generate_support_slug()` para não depender de `pgcrypto`, usando `gen_random_uuid()` (nativo do Postgres 13+) como fonte de entropia:

```sql
CREATE OR REPLACE FUNCTION public.generate_support_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.support_slug IS NULL OR NEW.support_slug = '' THEN
    NEW.support_slug := replace(
      replace(
        replace(
          encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'),
          '+', '-'),
        '/', '_'),
      '=', '');
  END IF;
  RETURN NEW;
END;
$function$;
```

Isso mantém o mesmo formato de slug (base64-url ~22 chars), sem precisar de pgcrypto.

## Sem mudanças no front
Nenhum arquivo do app precisa mudar. Depois da migration, o "Novo Cliente" (manual ou via reaproveitamento) volta a funcionar normalmente.

## Verificação
- Tentar adicionar um cliente em HefSys reaproveitando "Art Cont" — deve criar com sucesso.
- Conferir que o `support_slug` foi gerado.
