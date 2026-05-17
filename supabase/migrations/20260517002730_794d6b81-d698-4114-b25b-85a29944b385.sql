
-- =====================================================================
-- 1. RPC: create_booking (used by public CadastroScreen)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.create_booking(
  _nome text,
  _telefone text,
  _peso numeric,
  _sexo text,
  _idade int,
  _contraindicacoes text,
  _session_date date,
  _session_time text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_session_id uuid;
  v_payment_id uuid;
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

  INSERT INTO public.sessions (profile_id, session_date, session_time)
  VALUES (v_profile_id, _session_date, _session_time)
  RETURNING id INTO v_session_id;

  INSERT INTO public.payments (session_id)
  VALUES (v_session_id)
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'profile_id', v_profile_id,
    'session_id', v_session_id,
    'payment_id', v_payment_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking(text, text, numeric, text, int, text, date, text) TO anon, authenticated;

-- =====================================================================
-- 2. RPC: confirm_payment (used by public PagamentoScreen)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.confirm_payment(
  _payment_id uuid,
  _session_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payments
  SET status = 'paid', paid_at = now()
  WHERE id = _payment_id AND status <> 'paid';

  UPDATE public.sessions
  SET status = 'confirmed'
  WHERE id = _session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_payment(uuid, uuid) TO anon, authenticated;

-- =====================================================================
-- 3. profiles: lock down to admin only
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

CREATE POLICY "Admins can view profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================================
-- 4. sessions: admin full + rider can view own
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.sessions;

CREATE POLICY "Admins can view all sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders can view their own sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rider_profiles rp
      WHERE rp.user_id = auth.uid()
        AND rp.profile_id = sessions.profile_id
    )
  );

CREATE POLICY "Admins can update sessions"
  ON public.sessions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sessions"
  ON public.sessions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================================
-- 5. payments: admin only
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can read payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can update payments" ON public.payments;

CREATE POLICY "Admins can view payments"
  ON public.payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================================
-- 6. google_integrations: admin only (edge functions use service role)
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can delete google_integrations" ON public.google_integrations;
DROP POLICY IF EXISTS "Anyone can insert google_integrations" ON public.google_integrations;
DROP POLICY IF EXISTS "Anyone can read google_integrations" ON public.google_integrations;
DROP POLICY IF EXISTS "Anyone can update google_integrations" ON public.google_integrations;

CREATE POLICY "Admins can view google_integrations"
  ON public.google_integrations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update google_integrations"
  ON public.google_integrations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete google_integrations"
  ON public.google_integrations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
