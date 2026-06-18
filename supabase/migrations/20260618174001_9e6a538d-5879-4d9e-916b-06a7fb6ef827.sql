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