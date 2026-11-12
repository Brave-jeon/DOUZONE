-- Run once in the owner's Supabase Free SQL editor. Contains no member data or keys.
CREATE TABLE IF NOT EXISTS public.salespilot_encrypted_state (
 id integer PRIMARY KEY CHECK(id=1),
 revision bigint NOT NULL DEFAULT 0 CHECK(revision>=0),
 payload text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.salespilot_encrypted_state(id,revision,payload) VALUES(1,0,NULL) ON CONFLICT(id) DO NOTHING;
ALTER TABLE public.salespilot_encrypted_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.salespilot_encrypted_state FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.salespilot_encrypted_state TO service_role;
CREATE OR REPLACE FUNCTION public.salespilot_snapshot_read() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.salespilot_encrypted_state;
BEGIN
 SELECT * INTO item FROM public.salespilot_encrypted_state WHERE id=1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot state is missing'; END IF;
 RETURN jsonb_build_object('revision',item.revision,'payload',item.payload);
END; $$;
CREATE OR REPLACE FUNCTION public.salespilot_snapshot_version() RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT revision FROM public.salespilot_encrypted_state WHERE id=1;
$$;
CREATE OR REPLACE FUNCTION public.salespilot_snapshot_save(p_expected_revision bigint,p_payload text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_revision bigint;
BEGIN
 SELECT revision INTO current_revision FROM public.salespilot_encrypted_state WHERE id=1 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Snapshot state is missing'; END IF;
 IF p_expected_revision IS NULL OR p_expected_revision<>current_revision THEN
  RETURN jsonb_build_object('saved',false,'revision',current_revision);
 END IF;
 IF p_payload IS NULL OR length(p_payload)<44 OR length(p_payload)>60000000 OR p_payload !~ '^[A-Za-z0-9+/]+={0,2}$' THEN
  RAISE EXCEPTION 'Invalid encrypted snapshot';
 END IF;
 UPDATE public.salespilot_encrypted_state SET revision=current_revision+1,payload=p_payload,updated_at=clock_timestamp() WHERE id=1;
 RETURN jsonb_build_object('saved',true,'revision',current_revision+1);
END; $$;
REVOKE ALL ON FUNCTION public.salespilot_snapshot_read() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.salespilot_snapshot_version() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.salespilot_snapshot_save(bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.salespilot_snapshot_read() TO service_role;
GRANT EXECUTE ON FUNCTION public.salespilot_snapshot_version() TO service_role;
GRANT EXECUTE ON FUNCTION public.salespilot_snapshot_save(bigint,text) TO service_role;
