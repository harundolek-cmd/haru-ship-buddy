-- HARU TMS business modules. Apply after the existing USA / multi-company migrations.
-- No demo data, no service credentials, no change to live external integrations.
begin;
do $$ begin
  if to_regprocedure('public.current_company_id()') is null then
    raise exception 'Apply the existing multi-company migration (drizzle/migrations/0001_multi_tenant_permits_pay.sql) before this migration';
  end if;
end $$;
create unique index if not exists loads_id_company_unique on public.loads(id, company_id);
create unique index if not exists drivers_id_company_unique on public.drivers(id, company_id);
create unique index if not exists trucks_id_company_unique on public.trucks(id, company_id);
create unique index if not exists settlements_id_company_unique on public.settlements(id, company_id);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  name text not null,
  kind text not null default 'broker' check (kind in ('broker','customer','carrier','vendor')),
  contact_name text,
  email text,
  phone text,
  mc_number text,
  dot_number text,
  address text,
  payment_terms integer not null default 30 check(payment_terms between 0 and 365),
  credit_limit numeric(14,2) not null default 0 check(credit_limit >= 0),
  status text not null default 'active' check(status in ('active','on_hold','inactive')),
  notes text,
  unique(id,company_id)
);
alter table public.partners enable row level security;
create index partners_company_idx on public.partners(company_id);
grant select on public.partners to authenticated;
grant all on public.partners to service_role;
create policy "tenant read" on public.partners for select to authenticated using(company_id = public.current_company_id());
grant insert, update on public.partners to authenticated;
create policy "tenant insert" on public.partners for insert to authenticated with check(company_id = public.current_company_id());
create policy "tenant update" on public.partners for update to authenticated using(company_id = public.current_company_id()) with check(company_id = public.current_company_id());

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  quote_no text not null,
  partner_id uuid,
  origin text not null,
  destination text not null,
  equipment_type text not null default 'Flatbed',
  miles numeric(12,1) check(miles >= 0),
  amount numeric(14,2) not null check(amount >= 0),
  valid_until date,
  status text not null default 'draft' check(status in ('draft','sent','accepted','declined','converted')),
  load_id uuid,
  notes text,
  unique(id,company_id)
);
alter table public.quotes enable row level security;
create index quotes_company_idx on public.quotes(company_id);
grant select on public.quotes to authenticated;
grant all on public.quotes to service_role;
create policy "tenant read" on public.quotes for select to authenticated using(company_id = public.current_company_id());
grant insert, update on public.quotes to authenticated;
create policy "tenant insert" on public.quotes for insert to authenticated with check(company_id = public.current_company_id());
create policy "tenant update" on public.quotes for update to authenticated using(company_id = public.current_company_id()) with check(company_id = public.current_company_id());

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  invoice_no text not null,
  load_id uuid,
  customer_name text not null,
  issue_date date not null default current_date,
  due_date date not null,
  total numeric(14,2) not null check(total > 0),
  paid_amount numeric(14,2) not null default 0 check(paid_amount >= 0 and paid_amount <= total),
  status text not null default 'draft' check(status in ('draft','issued','void')),
  notes text,
  unique(id,company_id)
);
alter table public.invoices enable row level security;
create index invoices_company_idx on public.invoices(company_id);
grant select on public.invoices to authenticated;
grant all on public.invoices to service_role;
create policy "tenant read" on public.invoices for select to authenticated using(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));
grant insert, update on public.invoices to authenticated;
create policy "tenant insert" on public.invoices for insert to authenticated with check(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));
create policy "tenant update" on public.invoices for update to authenticated using(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin')) with check(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));

create table public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  invoice_id uuid not null,
  amount numeric(14,2) not null check(amount > 0),
  paid_on date not null default current_date,
  reference text,
  method text not null default 'ACH',
  request_id uuid not null,
  unique(id,company_id)
);
alter table public.invoice_payments enable row level security;
create index invoice_payments_company_idx on public.invoice_payments(company_id);
grant select on public.invoice_payments to authenticated;
grant all on public.invoice_payments to service_role;
create policy "tenant read" on public.invoice_payments for select to authenticated using(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  load_id uuid,
  truck_id uuid,
  expense_date date not null default current_date,
  category text not null default 'fuel' check(category in ('fuel','toll','repair','insurance','parking','escort','other')),
  vendor text,
  amount numeric(14,2) not null check(amount >= 0),
  reference text,
  notes text,
  unique(id,company_id)
);
alter table public.expenses enable row level security;
create index expenses_company_idx on public.expenses(company_id);
grant select on public.expenses to authenticated;
grant all on public.expenses to service_role;
create policy "tenant read" on public.expenses for select to authenticated using(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));
grant insert, update on public.expenses to authenticated;
create policy "tenant insert" on public.expenses for insert to authenticated with check(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));
create policy "tenant update" on public.expenses for update to authenticated using(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin')) with check(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));

create table public.maintenance (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  truck_id uuid not null,
  service text not null,
  due_date date not null,
  due_odometer integer check(due_odometer >= 0),
  status text not null default 'scheduled' check(status in ('scheduled','in_progress','completed','cancelled')),
  completed_date date,
  vendor text,
  cost numeric(14,2) not null default 0 check(cost >= 0),
  notes text,
  unique(id,company_id)
);
alter table public.maintenance enable row level security;
create index maintenance_company_idx on public.maintenance(company_id);
grant select on public.maintenance to authenticated;
grant all on public.maintenance to service_role;
create policy "tenant read" on public.maintenance for select to authenticated using(company_id = public.current_company_id());
grant insert, update on public.maintenance to authenticated;
create policy "tenant insert" on public.maintenance for insert to authenticated with check(company_id = public.current_company_id());
create policy "tenant update" on public.maintenance for update to authenticated using(company_id = public.current_company_id()) with check(company_id = public.current_company_id());

create table public.operations_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  title text not null,
  load_id uuid,
  assignee text,
  due_date date,
  priority text not null default 'normal' check(priority in ('low','normal','high','urgent')),
  status text not null default 'open' check(status in ('open','in_progress','done','cancelled')),
  notes text,
  unique(id,company_id)
);
alter table public.operations_tasks enable row level security;
create index operations_tasks_company_idx on public.operations_tasks(company_id);
grant select on public.operations_tasks to authenticated;
grant all on public.operations_tasks to service_role;
create policy "tenant read" on public.operations_tasks for select to authenticated using(company_id = public.current_company_id());
grant insert, update on public.operations_tasks to authenticated;
create policy "tenant insert" on public.operations_tasks for insert to authenticated with check(company_id = public.current_company_id());
create policy "tenant update" on public.operations_tasks for update to authenticated using(company_id = public.current_company_id()) with check(company_id = public.current_company_id());

create table public.load_stops (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  load_id uuid not null,
  sequence integer not null check(sequence > 0),
  kind text not null default 'pickup' check(kind in ('pickup','delivery','waypoint')),
  facility text,
  address text not null,
  appointment_at timestamptz,
  arrived_at timestamptz,
  departed_at timestamptz,
  contact text,
  reference text,
  notes text,
  unique(id,company_id)
);
alter table public.load_stops enable row level security;
create index load_stops_company_idx on public.load_stops(company_id);
grant select on public.load_stops to authenticated;
grant all on public.load_stops to service_role;
create policy "tenant read" on public.load_stops for select to authenticated using(company_id = public.current_company_id());
grant insert, update on public.load_stops to authenticated;
create policy "tenant insert" on public.load_stops for insert to authenticated with check(company_id = public.current_company_id());
create policy "tenant update" on public.load_stops for update to authenticated using(company_id = public.current_company_id()) with check(company_id = public.current_company_id());

create table public.compliance_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  driver_id uuid,
  truck_id uuid,
  document_type text not null default 'Insurance',
  reference text,
  expiry_date date not null,
  notes text,
  unique(id,company_id)
);
alter table public.compliance_records enable row level security;
create index compliance_records_company_idx on public.compliance_records(company_id);
grant select on public.compliance_records to authenticated;
grant all on public.compliance_records to service_role;
create policy "tenant read" on public.compliance_records for select to authenticated using(company_id = public.current_company_id());
grant insert, update on public.compliance_records to authenticated;
create policy "tenant insert" on public.compliance_records for insert to authenticated with check(company_id = public.current_company_id());
create policy "tenant update" on public.compliance_records for update to authenticated using(company_id = public.current_company_id()) with check(company_id = public.current_company_id());

create table public.settlement_loads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default public.current_company_id() references public.companies(id),
  created_at timestamptz not null default now(),
  settlement_id uuid not null,
  load_id uuid not null,
  unique(id,company_id)
);
alter table public.settlement_loads enable row level security;
create index settlement_loads_company_idx on public.settlement_loads(company_id);
grant select on public.settlement_loads to authenticated;
grant all on public.settlement_loads to service_role;
create policy "tenant read" on public.settlement_loads for select to authenticated using(company_id = public.current_company_id() and public.has_role(auth.uid(), 'admin'));
alter table public.quotes add foreign key (partner_id,company_id) references public.partners(id,company_id);
alter table public.quotes add foreign key (load_id,company_id) references public.loads(id,company_id);
alter table public.invoices add foreign key (load_id,company_id) references public.loads(id,company_id);
alter table public.invoice_payments add foreign key (invoice_id,company_id) references public.invoices(id,company_id);
alter table public.expenses add foreign key (load_id,company_id) references public.loads(id,company_id);
alter table public.expenses add foreign key (truck_id,company_id) references public.trucks(id,company_id);
alter table public.maintenance add foreign key (truck_id,company_id) references public.trucks(id,company_id);
alter table public.operations_tasks add foreign key (load_id,company_id) references public.loads(id,company_id);
alter table public.load_stops add foreign key (load_id,company_id) references public.loads(id,company_id);
alter table public.compliance_records add foreign key (driver_id,company_id) references public.drivers(id,company_id);
alter table public.compliance_records add foreign key (truck_id,company_id) references public.trucks(id,company_id);
alter table public.settlement_loads add foreign key (settlement_id,company_id) references public.settlements(id,company_id);
alter table public.settlement_loads add foreign key (load_id,company_id) references public.loads(id,company_id);

alter table public.quotes add unique(company_id,quote_no);
alter table public.quotes add check ((status='converted') = (load_id is not null));
revoke insert,update on public.quotes from authenticated;
grant insert(company_id,quote_no,partner_id,origin,destination,equipment_type,miles,amount,valid_until,status,notes),
 update(quote_no,partner_id,origin,destination,equipment_type,miles,amount,valid_until,status,notes) on public.quotes to authenticated;
create function public.protect_converted_quote() returns trigger language plpgsql set search_path=public as $$
begin
 if old.load_id is not null then raise exception 'Converted quotes are immutable. Edit the resulting load instead.'; end if;
 return new;
end $$;
create trigger protect_converted_quote before update on public.quotes for each row execute function public.protect_converted_quote();
alter table public.invoices add unique(company_id,invoice_no);
create unique index invoice_one_per_load on public.invoices(load_id) where status <> 'void' and load_id is not null;
alter table public.invoices add check(due_date >= issue_date);
alter table public.invoice_payments add unique(company_id,request_id);
alter table public.load_stops add unique(load_id,sequence);
alter table public.load_stops add check(departed_at is null or arrived_at is null or departed_at >= arrived_at);
alter table public.compliance_records add check(driver_id is not null or truck_id is not null);
alter table public.settlement_loads add unique(load_id);
-- Invoice paid_amount is maintained by the payment RPC, never by browser writes.
revoke insert,update on public.invoices from authenticated;
grant insert(invoice_no,load_id,customer_name,issue_date,due_date,total,status,notes,company_id),
 update(invoice_no,load_id,customer_name,issue_date,due_date,total,status,notes) on public.invoices to authenticated;
create function public.protect_paid_invoice() returns trigger language plpgsql set search_path=public as $$
begin
 if old.paid_amount > 0 and (new.total <> old.total or new.status='void' or new.load_id is distinct from old.load_id or new.customer_name <> old.customer_name) then
   raise exception 'Paid invoice totals, customer and load cannot be changed or voided';
 end if;
 return new;
end $$;
create trigger protect_paid_invoice before update on public.invoices for each row execute function public.protect_paid_invoice();
create function public.record_invoice_payment(p_invoice uuid,p_amount numeric,p_date date,p_method text,p_reference text,p_request uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare i public.invoices; payment_id uuid; cid uuid:=public.current_company_id();
begin
 if cid is null or not public.has_role(auth.uid(),'admin') then raise exception 'Administrator access required'; end if;
 select * into i from public.invoices where id=p_invoice and company_id=cid for update;
 if i.id is null then raise exception 'Invoice not found'; end if;
 select id into payment_id from public.invoice_payments where company_id=cid and request_id=p_request;
 if payment_id is not null then
   if not exists(select 1 from public.invoice_payments where id=payment_id and invoice_id=p_invoice and amount=p_amount and paid_on=p_date and method=p_method and reference is not distinct from p_reference) then raise exception 'Payment request already used with different details'; end if;
   return payment_id;
 end if;
 if i.status <> 'issued' or p_amount is null or p_amount <= 0 or round(p_amount,2) <> p_amount or p_amount > i.total-i.paid_amount or p_date is null or p_date > current_date or p_request is null then
   raise exception 'Enter a valid payment within the issued invoice balance, dated today or earlier';
 end if;
 insert into public.invoice_payments(company_id,invoice_id,amount,paid_on,method,reference,request_id)
 values(cid,i.id,p_amount,p_date,coalesce(p_method,'ACH'),p_reference,p_request) returning id into payment_id;
 update public.invoices set paid_amount=paid_amount+p_amount where id=i.id;
 return payment_id;
end $$;
revoke all on function public.record_invoice_payment(uuid,numeric,date,text,text,uuid) from public,anon;
grant execute on function public.record_invoice_payment(uuid,numeric,date,text,text,uuid) to authenticated;

create function public.convert_quote(p_quote uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare q public.quotes; p public.partners; new_load uuid; cid uuid:=public.current_company_id();
begin
 if cid is null then raise exception 'Company membership required'; end if;
 select * into q from public.quotes where id=p_quote and company_id=cid for update;
 if q.id is null then raise exception 'Quote not found'; end if;
 if q.load_id is not null then return q.load_id; end if;
 if q.status <> 'accepted' then raise exception 'Accept the quote before converting'; end if;
 if q.valid_until < current_date then raise exception 'Quote has expired'; end if;
 select * into p from public.partners where id=q.partner_id and company_id=cid;
 if p.status is not null and p.status <> 'active' then raise exception 'Customer is on hold or inactive'; end if;
 insert into public.loads(company_id,origin,destination,broker,broker_mc,reference_no,equipment_type,miles,rate,status,notes)
 values(cid,q.origin,q.destination,p.name,p.mc_number,q.quote_no,q.equipment_type,round(q.miles),q.amount,'rezerve',q.notes) returning id into new_load;
 update public.quotes set load_id=new_load,status='converted' where id=q.id;
 return new_load;
end $$;
revoke all on function public.convert_quote(uuid) from public,anon;
grant execute on function public.convert_quote(uuid) to authenticated;

-- Settlements are immutable snapshots; each delivered load can be settled only once.
revoke insert,update,delete on public.settlements from authenticated;
create function public.create_driver_settlement(p_driver uuid,p_start date,p_end date,p_deductions numeric,p_notes text)
returns uuid language plpgsql security definer set search_path=public as $$
declare d public.drivers; l public.loads; sid uuid; ids uuid[]:='{}'; gross numeric:=0; pay numeric:=0; details jsonb:='[]'; part numeric; cid uuid:=public.current_company_id();
begin
 if cid is null or not public.has_role(auth.uid(),'admin') then raise exception 'Administrator access required'; end if;
 if p_start is null or p_end is null or p_end < p_start or p_deductions is null or p_deductions < 0 then raise exception 'Invalid settlement dates or deductions'; end if;
 select * into d from public.drivers where id=p_driver and company_id=cid for update;
 if d.id is null or d.pay_rate is null or d.pay_type is null or d.pay_rate < 0 or (d.pay_type='percent' and d.pay_rate>100) or d.pay_type not in ('percent','per_mile','flat') then raise exception 'Driver pay settings are invalid'; end if;
 for l in select * from public.loads x where x.company_id=cid and x.driver_id=p_driver and x.status in ('teslim_edildi','invoiced') and x.delivery_date between p_start and p_end
   and not exists(select 1 from public.settlement_loads sl where sl.load_id=x.id)
   and not exists(select 1 from public.settlements old where old.company_id=cid and old.driver_id=p_driver and x.delivery_date between old.period_start and old.period_end
     and not exists(select 1 from public.settlement_loads sl where sl.settlement_id=old.id)) order by x.id for update
 loop
   part:=round(case d.pay_type when 'percent' then coalesce(l.rate,0)*d.pay_rate/100 when 'flat' then d.pay_rate else coalesce(l.miles,round(l.distance_km/1.609),0)*d.pay_rate end,2);
   gross:=gross+coalesce(l.rate,0); pay:=pay+part; ids:=array_append(ids,l.id);
   details:=details || jsonb_build_array(jsonb_build_object('load_id',l.id,'load_no',l.load_no,'linehaul',l.rate,'pay',part,'pay_type',d.pay_type,'pay_rate',d.pay_rate));
 end loop;
 if cardinality(ids)=0 then raise exception 'No unsettled delivered loads in this period'; end if;
 if p_deductions>pay then raise exception 'Deductions exceed driver pay'; end if;
 insert into public.settlements(company_id,driver_id,period_start,period_end,gross,driver_pay,deductions,net,details,notes)
 values(cid,p_driver,p_start,p_end,gross,pay,p_deductions,pay-p_deductions,details,p_notes) returning id into sid;
 insert into public.settlement_loads(company_id,settlement_id,load_id) select cid,sid,unnest(ids);
 return sid;
end $$;
revoke all on function public.create_driver_settlement(uuid,date,date,numeric,text) from public,anon;
grant execute on function public.create_driver_settlement(uuid,date,date,numeric,text) to authenticated;
commit;
