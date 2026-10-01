create type public.app_role as enum ('admin', 'dispatcher');
create type public.load_status as enum ('rezerve', 'sevk_edildi', 'yolda', 'teslim_edildi', 'iptal');
create type public.driver_status as enum ('musait', 'gorevde', 'izinli');
create type public.doc_type as enum ('BOL', 'POD');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  company_name text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update to authenticated using (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "roles read" on public.user_roles for select to authenticated using (true);
create policy "roles admin manage" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare is_first boolean;
begin
  insert into public.profiles (id, full_name, company_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'company_name');
  select not exists (select 1 from public.user_roles where role = 'admin') into is_first;
  insert into public.user_roles (user_id, role) values (new.id, case when is_first then 'admin'::public.app_role else 'dispatcher'::public.app_role end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  created_at timestamptz not null default now()
);
create table public.dispatchers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  license_no text,
  truck_plate text,
  status public.driver_status not null default 'musait',
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  origin text not null,
  destination text not null,
  distance_km integer,
  notes text,
  created_at timestamptz not null default now()
);
create table public.loads (
  id uuid primary key default gen_random_uuid(),
  load_no serial,
  origin text not null,
  destination text not null,
  distance_km integer,
  status public.load_status not null default 'rezerve',
  route_id uuid references public.routes(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  dispatcher_id uuid references public.dispatchers(id) on delete set null,
  pickup_date date,
  rate numeric,
  notes text,
  created_at timestamptz not null default now()
);
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  doc_type public.doc_type not null,
  file_path text not null,
  file_name text not null,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room text not null default 'genel',
  user_id uuid not null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['teams','dispatchers','drivers','routes','loads','documents'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (true)', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using (true)', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;
grant usage, select on sequence public.loads_load_no_seq to authenticated;

grant select, insert, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "msg read" on public.messages for select to authenticated using (true);
create policy "msg insert own" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "msg delete" on public.messages for delete to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
alter publication supabase_realtime add table public.messages;

create policy "docs read" on storage.objects for select to authenticated using (bucket_id = 'documents');
create policy "docs upload" on storage.objects for insert to authenticated with check (bucket_id = 'documents');
create policy "docs delete" on storage.objects for delete to authenticated using (bucket_id = 'documents' and public.has_role(auth.uid(),'admin'));

insert into public.teams (id, name, region) values
 ('11111111-0000-0000-0000-000000000001','Doğu Ekibi','Doğu Anadolu'),
 ('11111111-0000-0000-0000-000000000002','Batı Ekibi','Ege & Marmara'),
 ('11111111-0000-0000-0000-000000000003','Güney Ekibi','Akdeniz');
insert into public.dispatchers (id, full_name, email, phone, team_id) values
 ('22222222-0000-0000-0000-000000000001','Deniz Aksoy','deniz@haru.com','0532 111 22 01','11111111-0000-0000-0000-000000000002'),
 ('22222222-0000-0000-0000-000000000002','Kaan Tunç','kaan@haru.com','0532 111 22 02','11111111-0000-0000-0000-000000000001'),
 ('22222222-0000-0000-0000-000000000003','Selin Öztürk','selin@haru.com','0532 111 22 03','11111111-0000-0000-0000-000000000003'),
 ('22222222-0000-0000-0000-000000000004','Burak Arslan','burak@haru.com','0532 111 22 04','11111111-0000-0000-0000-000000000002');
insert into public.drivers (id, full_name, phone, license_no, truck_plate, status, team_id) values
 ('33333333-0000-0000-0000-000000000001','Mehmet Kaya','0533 200 10 01','E-448201','34 HRU 101','gorevde','11111111-0000-0000-0000-000000000002'),
 ('33333333-0000-0000-0000-000000000002','Ayşe Demir','0533 200 10 02','E-448202','16 HRU 202','gorevde','11111111-0000-0000-0000-000000000002'),
 ('33333333-0000-0000-0000-000000000003','Burak Şahin','0533 200 10 03','E-448203','06 HRU 303','gorevde','11111111-0000-0000-0000-000000000001'),
 ('33333333-0000-0000-0000-000000000004','Emre Yıldız','0533 200 10 04','E-448204','42 HRU 404','gorevde','11111111-0000-0000-0000-000000000003'),
 ('33333333-0000-0000-0000-000000000005','Zeynep Özkan','0533 200 10 05','E-448205','55 HRU 505','musait','11111111-0000-0000-0000-000000000001'),
 ('33333333-0000-0000-0000-000000000006','Cem Yılmaz','0533 200 10 06','E-448206','01 HRU 606','musait','11111111-0000-0000-0000-000000000003'),
 ('33333333-0000-0000-0000-000000000007','Hakan Çelik','0533 200 10 07','E-448207','35 HRU 707','izinli','11111111-0000-0000-0000-000000000002');
insert into public.routes (id, name, origin, destination, distance_km) values
 ('44444444-0000-0000-0000-000000000001','Ege Hattı','İzmir','Ankara',580),
 ('44444444-0000-0000-0000-000000000002','Marmara Kısa','Bursa','Kocaeli',124),
 ('44444444-0000-0000-0000-000000000003','Güney Koridoru','İstanbul','Adana',940),
 ('44444444-0000-0000-0000-000000000004','Doğu Hattı','Ankara','Gaziantep',712),
 ('44444444-0000-0000-0000-000000000005','Karadeniz Sahil','Samsun','Trabzon',335);
insert into public.loads (origin, destination, distance_km, status, route_id, driver_id, dispatcher_id, pickup_date, rate) values
 ('İzmir','Ankara',580,'yolda','44444444-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001',current_date,28500),
 ('Bursa','Kocaeli',124,'sevk_edildi','44444444-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000002',current_date,9200),
 ('İstanbul','Adana',940,'rezerve','44444444-0000-0000-0000-000000000003',null,'22222222-0000-0000-0000-000000000001',current_date+1,41000),
 ('Ankara','Gaziantep',712,'yolda','44444444-0000-0000-0000-000000000004','33333333-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000002',current_date,33800),
 ('Konya','Antalya',300,'yolda',null,'33333333-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000003',current_date,15600),
 ('Samsun','Trabzon',335,'teslim_edildi','44444444-0000-0000-0000-000000000005','33333333-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000004',current_date-1,17400);
