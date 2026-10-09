# HARU TMS — capability research and delivery

Research date: 2026-10-09. Sources are vendors' public product pages, not access to private customer applications. This is a representative comparison of six products, not an exhaustive review of every TMS. Features below are an independent implementation in HARU's existing React/Supabase app.

| Product and official source                                                       | Relevant advertised capabilities                                              | HARU implementation                                                                                                                    |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [AscendTMS](https://www.thefreetms.com/feature-categories/carriers)               | Dispatch, documents, load financials, accounting and settlements              | Load editing, status planner, BOL/POD, invoices, payment journal, driver settlements                                                   |
| [Dispatchland](https://dispatchland.com/)                                         | Shipment/driver/route overview, communication, GPS and performance visibility | Planner, manual location map with timestamps, existing team chat and operational reports; no GPS provider connected                    |
| [Truckbase](https://www.truckbase.com/trucking-invoicing-software)                | Load-based invoicing and accounting workflow                                  | Delivered-load invoice drafts, receivables aging, payment recording and printable freight documents                                    |
| [Rose Rocket](https://www.roserocket.com/personas-pages/ltl-carriers)             | Quotes, dispatch, multi-leg operations, portal, integrations and reporting    | Quotes converted atomically to loads, ordered stops, appointment/arrival/departure timestamps; no LTL rating engine or customer portal |
| [Axon](https://axonsoftware.com/fleet-maintenance-software/)                      | Preventive maintenance, work orders, fleet costs and renewals                 | Maintenance records, date/odometer targets, vendor/cost tracking and expiring compliance records; no telematics odometer feed          |
| [Tailwind](https://www.cargowise.com/solutions/cargowise-transport/tailwind-tms/) | CRM, quotes, dispatch, receivables/payables, documents and settlements        | Partner CRM, offers, load operations, expenses, invoices, driver settlements and CSV exports                                           |

## Delivered workflows

- **Operations:** editable loads, status-column planner, ordered pickup/delivery/waypoint stops, tasks with priorities and deadlines, driver/truck assignments and permit records.
- **Fleet:** driver and equipment registers, manual location coordinates and update times, maintenance scheduling/completion/costs, expiring driver/vehicle compliance documents.
- **Commercial:** customer/broker/carrier/vendor CRM with contacts, MC/DOT, credit limits, payment terms and account status. Quotes track lane, equipment, miles, rate, expiry and acceptance. Accepted unexpired quotes can create one load; converted quotes are immutable. Credit limits and payment terms are recorded, not an automated credit decision engine.
- **Finance:** invoice drafts from delivered loads include linehaul, detention and lumper; issue/void workflow, partial payments, payment journal, balance/overdue status and receivables aging. Payments are records only; the app does not initiate bank transfers. Driver settlement snapshots support percentage of linehaul, per-mile or flat pay, deductions and duplicate-load protection.
- **Documents:** private BOL/POD upload, short-lived signed download links and printable BOL/rate-confirmation/freight-charge views. A charge summary is not presented as an issued invoice when no invoice exists.
- **Reports:** delivery-period revenue, loaded miles and RPM, customer totals, recorded cost categories and receivables aging. Recorded margin is not a complete accounting net profit: unsettled wages, depreciation and unrecorded costs are excluded. Avoid recording the same maintenance/permit expense twice.
- **Settings:** company identity and dispatcher invitations. Invitations do not send email automatically; existing-user membership changes need administrator assistance.

## Security and deployment

Migration: `supabase/migrations/20261009100000_business_modules.sql`. Requires the existing USA trucking and multi-company schemas. Adds 10 RLS-protected tenant tables and three business RPCs. Composite foreign keys prevent cross-company references. Financial writes require administrator access; invoice balance writes and direct settlement changes are denied. Payment requests are idempotent and locked against overpayment. Legacy settlements without load links exclude their already-covered delivery periods.

Applied through the connected Lovable project's database on 2026-10-09 and recorded as version `20261009100000` in `supabase_migrations.schema_migrations`. All 10 new tables were verified to have RLS enabled. Follow-up migration `20261009101000_business_privileges.sql` removes broad Supabase default grants. Both versions are recorded in migration history. No sample records were inserted into production.

## External services still required

Live ELD/GPS, DAT/Truckstop load boards, QuickBooks accounting sync, carrier verification, email/SMS delivery, EDI, fuel-card feeds, IFTA reporting, automated permit decisions and an authenticated customer portal are **not implemented integrations**. The Integrations page explicitly identifies missing provider credentials, agreements and remaining work. Existing map positions are manual reports, not live tracking. Oversize screening is informational and does not replace route/permit verification.

## Verification

- `npx tsc --noEmit`
- `npm run build`
- `npm test`
- SQL isolation and transaction tests: `scripts/test-business-db.mjs` runs the exact migration in PGlite with tenant/admin fixtures. See the script header for the optional test-only PGlite dependency. It checks tenant boundaries, overpayment, payment retries, invoice immutability, quote conversion and settlement duplication. This is not a substitute for provider-backed integration testing.
