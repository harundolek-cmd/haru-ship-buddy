-- Supabase may grant broad table privileges through default privileges.
-- RLS already protects row access; remove unnecessary table-level capabilities too.
begin;
revoke all on public.partners, public.quotes, public.invoices, public.invoice_payments,
 public.expenses, public.maintenance, public.operations_tasks, public.load_stops,
 public.compliance_records, public.settlement_loads, public.settlements from anon, public;
revoke delete, truncate, references, trigger on public.partners, public.quotes,
 public.invoices, public.invoice_payments, public.expenses, public.maintenance,
 public.operations_tasks, public.load_stops, public.compliance_records,
 public.settlement_loads, public.settlements from authenticated;
revoke insert, update on public.invoice_payments, public.settlement_loads from authenticated;
commit;
