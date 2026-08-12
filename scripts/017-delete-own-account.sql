-- Apaga todos os dados do usuário autenticado e a conta Auth.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  uid_text text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  uid_text := uid::text;

  DELETE FROM habit_completions WHERE user_id = uid_text;
  DELETE FROM rewards WHERE user_id = uid_text;
  DELETE FROM disciplines WHERE user_id = uid_text;
  DELETE FROM reminders WHERE user_id = uid_text;
  DELETE FROM habits WHERE user_id = uid_text;
  DELETE FROM user_stats WHERE user_id = uid_text;

  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

NOTIFY pgrst, 'reload schema';
