# HARU TMS — US rebuild (Dispatchland-style)

## Goals
- Entire app in English, US-only (remove Turkish names, Turkish lanes, Turkish status labels).
- Professional, dense dispatch UI inspired by Dispatchland TMS: dark slim sidebar, top bar with company switcher/user menu, data tables with filters, status-colored badges and row accents.
- Each company is fully isolated (multi-tenant).
- Separate Admin and Dispatcher accounts.

## Multi-tenant accounts
- New `companies` table (name, MC#, DOT#, address, phone).
- Sign up = "Create company account": creates the company and makes that user its **Admin**.
- Admin invites dispatchers by email from Settings > Users; they join that company as **Dispatcher**.
- Every data table (loads, drivers, trucks, dispatchers, teams, routes, documents, messages, permits, settlements) gets `company_id`; access rules only show rows for the signed-in user's company. Another company never sees your data.
- Admin-only: users/roles, company settings, deleting records, driver pay settings. Dispatchers: loads, drivers, trucks, permits, documents, chat.
- Existing demo data is moved to a "HARU Logistics" demo company and replaced with US names, US lanes (e.g. Houston TX -> Chicago IL).

## New features
1. **Permits page** — per oversize load: state, permit #, type (Oversize / Overweight / Superload / Escort), issue/expiry dates, cost, file upload, status (Pending / Active / Expired). Oversize loads show a "Permits required" warning until permits are attached.
2. **Driver Pay / Settlements** — each driver has a pay type: % of gross, per mile, or flat. Settlement page picks a driver + date range, lists delivered loads, calculates gross, driver pay, deductions (fuel, advances, escrow), net pay; printable settlement sheet.
3. **Document generator** — from any load, generate a printable/downloadable **BOL**, **Rate Confirmation**, and **Invoice** (PDF via browser print) pre-filled with company, shipper, consignee, commodity, weight, dims; can be saved to the load's documents.
4. **Status colors** — Booked (blue), Dispatched (indigo-free slate/teal), In Transit (amber), Delivered (green), Invoiced (copper), Cancelled (red); used on badges, table row accent, map markers, and dashboard.

## Pages (English)
Dashboard, Loads (Load Builder), Dispatch Board, Live Map, Drivers, Trucks & Trailers, Permits, Driver Pay, Documents, Dispatchers & Teams, Chat, Settings (Company, Users).

## Technical details
- Migration: `companies`, `company_members(user_id, company_id)`, helper `current_company_id()` security-definer; add `company_id` (default `current_company_id()`) to all tables, backfill demo company, replace RLS policies with company-scoped ones; `has_role` stays in `user_roles` scoped by company membership.
- New tables: `permits`, `driver_pay_settings` (columns on drivers: pay_type, pay_rate), `settlements`, `invitations`.
- Add load statuses `invoiced` (enum additive); map old enum values to English labels in UI.
- `handle_new_user` updated: if signup has an invite -> join that company as dispatcher; else create company and become admin.
- New design tokens in styles.css (navy sidebar, white surfaces, status palette); memory updated to English UI.
