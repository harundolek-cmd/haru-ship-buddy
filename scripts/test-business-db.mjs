// Disposable PostgreSQL-compatible test DB, never the production database.
// Run: npm install --no-save --package-lock=false @electric-sql/pglite@0.5.8
//      node scripts/test-business-db.mjs
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { PGlite } = await import(process.env.HARU_PGLITE_PATH || "@electric-sql/pglite");
const db = new PGlite();
await db.exec(`
 create role authenticated; create role anon; create role service_role;
 create schema auth;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.user',true),'')::uuid $$;
 grant usage on schema auth to authenticated;
 create table companies(id uuid primary key default gen_random_uuid(),name text);
 create table company_members(user_id uuid primary key,company_id uuid references companies(id),role text);
 create function current_company_id() returns uuid language sql stable security definer set search_path=public as $$ select company_id from company_members where user_id=auth.uid() $$;
 create function has_role(u uuid,r text) returns boolean language sql stable security definer set search_path=public as $$ select coalesce((select role=r from company_members where user_id=u),false) $$;
 create table drivers(id uuid primary key default gen_random_uuid(),company_id uuid not null,full_name text,pay_type text,pay_rate numeric);
 create table trucks(id uuid primary key default gen_random_uuid(),company_id uuid not null);
 create table loads(id uuid primary key default gen_random_uuid(),company_id uuid not null,load_no integer generated always as identity,origin text,destination text,broker text,broker_mc text,reference_no text,equipment_type text,miles integer,distance_km integer,rate numeric,status text,notes text,driver_id uuid,delivery_date date);
 create table settlements(id uuid primary key default gen_random_uuid(),company_id uuid not null,driver_id uuid,period_start date,period_end date,gross numeric,driver_pay numeric,deductions numeric,net numeric,details jsonb,notes text);
 grant select,insert,update,delete on settlements to authenticated;
 insert into companies(id,name) values('10000000-0000-0000-0000-000000000001','A'),('20000000-0000-0000-0000-000000000001','B');
 insert into company_members values('10000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','admin'),('20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','admin'),('10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','dispatcher');
 insert into drivers values('10000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000001','Driver A','percent',25);
 insert into loads(company_id,driver_id,origin,destination,rate,miles,status,delivery_date) values('10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000010','Dallas','Austin',1000,200,'teslim_edildi','2026-10-01');
`);
await db.exec(
  "alter default privileges in schema public grant all on tables to authenticated, anon;",
);
await db.exec(
  await readFile(
    new URL("../supabase/migrations/20261009100000_business_modules.sql", import.meta.url),
    "utf8",
  ),
);
await db.exec(
  await readFile(
    new URL("../supabase/migrations/20261009101000_business_privileges.sql", import.meta.url),
    "utf8",
  ),
);
const privileges = await db.query(
  "select has_table_privilege('authenticated','invoice_payments','INSERT') direct_payment, has_table_privilege('authenticated','invoices','TRUNCATE') truncation, has_table_privilege('anon','quotes','SELECT') anonymous_read",
);
assert.deepEqual(privileges.rows[0], {
  direct_payment: false,
  truncation: false,
  anonymous_read: false,
});
let checks = 1;
async function asUser(id) {
  await db.exec(
    `reset role; select set_config('test.user','${id}',false); set role authenticated;`,
  );
}
async function fails(sql, pattern) {
  await assert.rejects(() => db.query(sql), pattern);
  checks++;
}
const a = "10000000-0000-0000-0000-000000000002",
  b = "20000000-0000-0000-0000-000000000002",
  staff = "10000000-0000-0000-0000-000000000003";
await asUser(a);
const partner = (
  await db.query("insert into partners(name,kind) values('Broker A','broker') returning id")
).rows[0].id;
const inv = (
  await db.query(
    "insert into invoices(invoice_no,customer_name,total,status,due_date) values('INV-1','Broker A',1000,'issued',current_date+30) returning id",
  )
).rows[0].id;
await fails(`update invoices set paid_amount=500 where id='${inv}'`, /permission denied/);
await fails(
  `insert into invoices(invoice_no,customer_name,total,paid_amount,due_date) values('BAD','Bad',100,50,current_date)`,
  /permission denied/,
);
const req = "30000000-0000-0000-0000-000000000001";
const payment = `select record_invoice_payment('${inv}',250,current_date,'ACH','ref','${req}')`;
await db.query(payment);
await db.query(payment);
assert.equal(
  Number(
    (await db.query(`select paid_amount from invoices where id='${inv}'`)).rows[0].paid_amount,
  ),
  250,
);
checks++;
assert.equal((await db.query("select * from invoice_payments")).rows.length, 1);
checks++;
await fails(
  `select record_invoice_payment('${inv}',999,current_date,'ACH','ref','30000000-0000-0000-0000-000000000002')`,
  /valid payment/,
);
await fails(
  `select record_invoice_payment('${inv}',251,current_date,'ACH','ref','${req}')`,
  /different details/,
);
await fails(`update invoices set status='void' where id='${inv}'`, /Paid invoice/);
await fails(`update invoices set total=1200 where id='${inv}'`, /Paid invoice/);
await asUser(b);
assert.equal((await db.query("select * from invoices")).rows.length, 0);
checks++;
await fails(
  `insert into quotes(quote_no,partner_id,origin,destination,amount) values('Q-X','${partner}','A','B',1)`,
  /foreign key/,
);
await fails(
  `select record_invoice_payment('${inv}',1,current_date,'ACH','ref','30000000-0000-0000-0000-000000000003')`,
  /Invoice not found/,
);
await asUser(staff);
assert.equal((await db.query("select * from invoices")).rows.length, 0);
checks++;
await fails(
  `select record_invoice_payment('${inv}',1,current_date,'ACH','ref','30000000-0000-0000-0000-000000000003')`,
  /Administrator/,
);
await fails(
  `insert into invoices(invoice_no,customer_name,total,due_date) values('STAFF','X',100,current_date)`,
  /row-level security/,
);
await asUser(a);
const quote = (
  await db.query(
    `insert into quotes(quote_no,partner_id,origin,destination,amount,status) values('Q-1','${partner}','A','B',1500,'accepted') returning id`,
  )
).rows[0].id;
const first = (await db.query(`select convert_quote('${quote}') as id`)).rows[0].id;
assert.equal((await db.query(`select convert_quote('${quote}') as id`)).rows[0].id, first);
checks++;
await fails(`update quotes set amount=999 where id='${quote}'`, /immutable/);
await fails(
  `insert into quotes(quote_no,origin,destination,amount,status) values('Q-BAD','A','B',1,'converted')`,
  /check constraint/,
);
const stmt =
  "select create_driver_settlement('10000000-0000-0000-0000-000000000010','2026-10-01','2026-10-31',25,'Test') as id";
await db.query(stmt);
assert.equal(Number((await db.query("select net from settlements")).rows[0].net), 225);
checks++;
await fails(stmt, /No unsettled/);
await fails("update settlements set net=999", /permission denied/);
await db.close();
console.log(
  `PASS: migration applied; ${checks} tenant, invoice, quote and settlement assertions passed.`,
);
