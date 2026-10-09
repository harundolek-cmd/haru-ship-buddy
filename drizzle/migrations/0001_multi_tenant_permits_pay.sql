ALTER TYPE public.load_status ADD VALUE IF NOT EXISTS 'invoiced';

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mc_number text, dot_number text, address text, phone text, email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.company_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ select company_id from public.company_members where user_id = auth.uid() $$;

CREATE POLICY "company read" ON public.companies FOR SELECT TO authenticated USING (id = public.current_company_id());
CREATE POLICY "company admin update" ON public.companies FOR UPDATE TO authenticated USING (id = public.current_company_id() AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "members read" ON public.company_members FOR SELECT TO authenticated USING (company_id = public.current_company_id());

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'dispatcher',
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv admin" ON public.invitations FOR ALL TO authenticated
  USING (company_id = public.current_company_id() AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (company_id = public.current_company_id() AND public.has_role(auth.uid(),'admin'));

CREATE TABLE public.permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  load_id uuid REFERENCES public.loads(id) ON DELETE SET NULL,
  state text NOT NULL,
  permit_no text,
  permit_type text NOT NULL DEFAULT 'Oversize',
  issue_date date, expiry_date date,
  cost numeric,
  status text NOT NULL DEFAULT 'pending',
  file_path text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  period_start date, period_end date,
  gross numeric NOT NULL DEFAULT 0,
  driver_pay numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  details jsonb, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permits, public.settlements TO authenticated;
GRANT ALL ON public.permits, public.settlements TO service_role;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.drivers ADD COLUMN pay_type text NOT NULL DEFAULT 'percent';
ALTER TABLE public.drivers ADD COLUMN pay_rate numeric NOT NULL DEFAULT 25;

-- demo company + backfill
INSERT INTO public.companies (id, name, mc_number, dot_number, address, phone, email)
VALUES ('00000000-0000-0000-0000-000000000001','HARU Logistics LLC','MC-1184520','3391027','2100 Commerce St, Dallas, TX 75201','(214) 555-0142','dispatch@harulogistics.com');
INSERT INTO public.company_members (user_id, company_id)
SELECT id, '00000000-0000-0000-0000-000000000001' FROM auth.users;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['dispatchers','documents','drivers','loads','messages','routes','teams','trucks'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN company_id uuid DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE public.%I SET company_id = ''00000000-0000-0000-0000-000000000001''', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN company_id SET NOT NULL', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin delete" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff update" ON public.%I', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['dispatchers','documents','drivers','loads','routes','teams','trucks','permits','settlements'] LOOP
    EXECUTE format('CREATE POLICY "co read" ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', t);
    EXECUTE format('CREATE POLICY "co insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id())', t);
    EXECUTE format('CREATE POLICY "co update" ON public.%I FOR UPDATE TO authenticated USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id())', t);
    EXECUTE format('CREATE POLICY "co admin delete" ON public.%I FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "msg read" ON public.messages;
DROP POLICY IF EXISTS "msg insert own" ON public.messages;
DROP POLICY IF EXISTS "msg delete" ON public.messages;
CREATE POLICY "msg read" ON public.messages FOR SELECT TO authenticated USING (company_id = public.current_company_id());
CREATE POLICY "msg insert own" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND company_id = public.current_company_id());
CREATE POLICY "msg delete" ON public.messages FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')));

DROP POLICY IF EXISTS "profiles read" ON public.profiles;
CREATE POLICY "profiles read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR id IN (select user_id from public.company_members where company_id = public.current_company_id()));

DROP POLICY IF EXISTS "roles read" ON public.user_roles;
DROP POLICY IF EXISTS "roles admin manage" ON public.user_roles;
CREATE POLICY "roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id IN (select user_id from public.company_members where company_id = public.current_company_id()));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND user_id IN (select user_id from public.company_members where company_id = public.current_company_id()))
  WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id IN (select user_id from public.company_members where company_id = public.current_company_id()));

-- storage scoped by company folder or document/permit ownership
DROP POLICY IF EXISTS "docs read" ON storage.objects;
DROP POLICY IF EXISTS "docs upload" ON storage.objects;
DROP POLICY IF EXISTS "docs delete" ON storage.objects;
CREATE POLICY "docs read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documents' AND (
    (storage.foldername(name))[1] = public.current_company_id()::text
    OR EXISTS (select 1 from public.documents d where d.file_path = name and d.company_id = public.current_company_id())
  ));
CREATE POLICY "docs upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = public.current_company_id()::text);
CREATE POLICY "docs delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = public.current_company_id()::text AND public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
declare inv record; cid uuid;
begin
  insert into public.profiles (id, full_name, company_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'company_name');

  select * into inv from public.invitations
   where lower(email) = lower(new.email) and accepted_at is null
   order by created_at desc limit 1;

  if inv.id is not null then
    insert into public.company_members (user_id, company_id) values (new.id, inv.company_id);
    insert into public.user_roles (user_id, role) values (new.id, inv.role);
    update public.invitations set accepted_at = now() where id = inv.id;
  else
    insert into public.companies (name, email)
    values (coalesce(nullif(new.raw_user_meta_data->>'company_name',''), split_part(new.email,'@',1) || ' Trucking'), new.email)
    returning id into cid;
    insert into public.company_members (user_id, company_id) values (new.id, cid);
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
