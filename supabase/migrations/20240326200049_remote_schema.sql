set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.requesting_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$-- https://clerk.com/docs/integrations/databases/supabase
-- This function returns the Clerk user ID provided by a JWT
-- to Supabase, where the JWT comes from Clerk's "getToken"
-- function.

  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$function$
;


