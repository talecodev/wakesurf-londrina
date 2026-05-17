CREATE OR REPLACE FUNCTION public.create_booking(_nome text, _telefone text, _peso numeric, _sexo text, _idade integer, _contraindicacoes text, _session_date date, _session_time text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
  v_session_id uuid;
BEGIN
  IF _nome IS NULL OR length(trim(_nome)) = 0 THEN
    RAISE EXCEPTION 'nome obrigatório';
  END IF;
  IF _telefone IS NULL OR length(trim(_telefone)) = 0 THEN
    RAISE EXCEPTION 'telefone obrigatório';
  END IF;
  IF _session_date IS NULL OR _session_time IS NULL THEN
    RAISE EXCEPTION 'data e horário obrigatórios';
  END IF;

  INSERT INTO public.profiles (nome, telefone, peso, sexo, idade, contraindicacoes)
  VALUES (_nome, _telefone, _peso, _sexo, _idade, _contraindicacoes)
  RETURNING id INTO v_profile_id;

  INSERT INTO public.sessions (profile_id, session_date, session_time, status)
  VALUES (v_profile_id, _session_date, _session_time, 'requested')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'profile_id', v_profile_id,
    'session_id', v_session_id
  );
END;
$function$;