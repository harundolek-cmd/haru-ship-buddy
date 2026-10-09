import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useRecords, today, loadRevenue, agingBucket, exportCsv, cents } from "@/lib/business";
import { useCurrentUser, useList } from "@/lib/tms";
import { usd } from "@/lib/equipment";
import { PageHeader, Panel, Kpi, Field, Empty, TableShell, Th, Td } from "@/components/tms/ui";
import { QueryNotice } from "@/components/tms/business/ResourceManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });
function Reports() {
  const { isAdmin } = useCurrentUser(),
    loads = useRecords("loads"),
    expenses = useRecords("expenses"),
    invoices = useRecords("invoices"),
    maintenance = useRecords("maintenance"),
    permits = useRecords("permits"),
    settlements = useRecords("settlements");
  const dispatchers = useList("dispatchers").data ?? [];
  const [start, setStart] = useState(today().slice(0, 7) + "-01"),
    [end, setEnd] = useState(today());
  const queries = [loads, expenses, invoices, maintenance, permits, settlements];
  const failed = queries.find((q) => q.error),
    inPeriod = (d: string | null) => !!d && d >= start && d <= end;
  const completed = (loads.data ?? []).filter(
    (l) => ["teslim_edildi", "invoiced"].includes(l.status) && inPeriod(l.delivery_date),
  );
  const revenue = completed.reduce((s, l) => s + loadRevenue(l), 0),
    miles = completed.reduce(
      (s, l) => s + (l.miles ?? Math.round((l.distance_km ?? 0) / 1.609)),
      0,
    );
  const costs = (expenses.data ?? [])
    .filter((e) => inPeriod(e.expense_date))
    .reduce((s, e) => s + e.amount, 0);
  const maintenanceCost = (maintenance.data ?? [])
    .filter((m) => m.status === "completed" && inPeriod(m.completed_date))
    .reduce((s, m) => s + m.cost, 0);
  const permitCost = (permits.data ?? [])
    .filter((p) => inPeriod(p.issue_date))
    .reduce((s, p) => s + Number(p.cost ?? 0), 0);
  const driverCost = (settlements.data ?? [])
    .filter((s) => inPeriod(s.period_end))
    .reduce((a, s) => a + Number(s.driver_pay), 0);
  const totalCost = cents(costs + maintenanceCost + permitCost + driverCost);
  const grouped = Object.values(
    completed.reduce<
      Record<string, { name: string; loads: number; revenue: number; miles: number }>
    >((a, l) => {
      const k = l.broker || "Unspecified customer";
      a[k] ??= { name: k, loads: 0, revenue: 0, miles: 0 };
      a[k].loads++;
      a[k].revenue += loadRevenue(l);
      a[k].miles += l.miles ?? Math.round((l.distance_km ?? 0) / 1.609);
      return a;
    }, {}),
  ).sort((a, b) => b.revenue - a.revenue);
  const balances = (invoices.data ?? []).filter(
    (i) => i.status === "issued" && i.total > i.paid_amount,
  );
  const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: date.toLocaleDateString("en-US", { month: "short" }), revenue: (loads.data ?? []).filter((l) => l.delivery_date?.startsWith(key) && ["teslim_edildi", "invoiced"].includes(l.status)).reduce((sum, l) => sum + loadRevenue(l), 0) };
  });
  const dispatcherPerformance = dispatchers.map((d) => {
    const delivered = completed.filter((l) => l.dispatcher_id === d.id);
    return { ...d, loads: delivered.length, revenue: delivered.reduce((sum, l) => sum + loadRevenue(l), 0), miles: delivered.reduce((sum, l) => sum + (l.miles ?? Math.round((l.distance_km ?? 0) / 1.609)), 0) };
  }).filter((d) => d.loads > 0).sort((a, b) => b.revenue - a.revenue);
  if (!isAdmin) return <Empty text="Company administrator access required." />;
  return (
    <>
      <PageHeader
        title="Reports & Receivables Aging"
        subtitle="Delivered-load revenue and recorded operating costs. These are operational reports, not a complete general ledger."
      />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="From">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Through">
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Button
          variant="outline"
          disabled={!!failed || queries.some((q) => q.isLoading) || start > end}
          onClick={() =>
            exportCsv(
              "customer-revenue.csv",
              ["Customer", "Loads", "Revenue", "Loaded miles", "Revenue / loaded mile"],
              grouped.map((g) => [
                g.name,
                g.loads,
                cents(g.revenue),
                g.miles,
                g.miles ? cents(g.revenue / g.miles) : "",
              ]),
            )
          }
        >
          Export customer report
        </Button>
      </div>
      {failed ? (
        <QueryNotice error={failed.error} />
      ) : queries.some((q) => q.isLoading) ? (
        <Empty text="Calculating reports…" />
      ) : !start || !end || start > end ? (
        <Empty text="Choose a valid date range." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Delivered revenue" value={usd(revenue)} />
            <Kpi label="Recorded costs" value={usd(totalCost)} color="--st-transit" />
            <Kpi
              label="Revenue less recorded costs"
              value={usd(revenue - totalCost)}
              color="--st-delivered"
            />
            <Kpi
              label="Revenue / loaded mile"
              value={miles ? usd(revenue / miles) : "—"}
              color="--st-invoiced"
            />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
            <Panel title="Monthly revenue trend">
              <div className="grid grid-cols-6 gap-2 p-5 sm:grid-cols-12">
                {monthlyRevenue.map((month) => {
                  const peak = Math.max(...monthlyRevenue.map((item) => item.revenue), 1);
                  return <div key={month.key} className="group flex min-w-0 flex-col items-center gap-2"><div className="flex h-28 w-full items-end rounded-t-md bg-secondary/50"><div className="w-full rounded-t-md bg-primary/80 group-hover:bg-primary" style={{ height: `${Math.max((month.revenue / peak) * 100, month.revenue ? 8 : 2)}%` }} title={`${month.label}: ${usd(month.revenue)}`} /></div><span className="text-[10px] text-muted-foreground">{month.label}</span></div>;
                })}
              </div>
            </Panel>
            <Panel title="Dispatcher totals">
              {dispatcherPerformance.length ? <TableShell head={<><Th>Dispatcher</Th><Th>Loads</Th><Th>Revenue</Th></>}>{dispatcherPerformance.map((d) => <tr key={d.id}><Td className="font-medium">{d.full_name}</Td><Td className="font-mono">{d.loads}</Td><Td className="font-mono">{usd(d.revenue)}</Td></tr>)}</TableShell> : <Empty text="No dispatcher totals for this period." />}
            </Panel>
          </div>
          <Panel title="Cost basis">
            <div className="grid gap-3 p-4 text-sm sm:grid-cols-4">
              <p>
                Expenses <b>{usd(costs)}</b>
              </p>
              <p>
                Completed maintenance <b>{usd(maintenanceCost)}</b>
              </p>
              <p>
                Permits issued <b>{usd(permitCost)}</b>
              </p>
              <p>
                Settled driver pay <b>{usd(driverCost)}</b>
              </p>
            </div>
            <p className="px-4 pb-4 text-xs text-muted-foreground">
              Revenue uses delivery date; costs use expense, service completion, permit issue or
              settlement end date. Unsettled driver pay, taxes, depreciation and unrecorded costs
              are excluded. Do not duplicate maintenance or permit costs in Expenses.
            </p>
          </Panel>
          <Panel title="Revenue by customer">
            <TableShell
              head={
                <>
                  <Th>Customer</Th>
                  <Th>Delivered loads</Th>
                  <Th>Revenue</Th>
                  <Th>Loaded miles</Th>
                  <Th>Revenue / mile</Th>
                </>
              }
            >
              {grouped.map((g) => (
                <tr key={g.name}>
                  <Td>{g.name}</Td>
                  <Td>{g.loads}</Td>
                  <Td>{usd(g.revenue)}</Td>
                  <Td>{g.miles.toLocaleString()}</Td>
                  <Td>{g.miles ? usd(g.revenue / g.miles) : "—"}</Td>
                </tr>
              ))}
            </TableShell>
            {!grouped.length && <Empty text="No delivered loads in this period." />}
          </Panel>
          <Panel title="Outstanding receivables · all issued invoices as of today">
            <div className="grid gap-4 p-4 sm:grid-cols-5">
              {["Current", "1–30", "31–60", "61–90", "90+"].map((b) => (
                <Kpi
                  key={b}
                  label={b === "Current" ? b : b + " days overdue"}
                  value={usd(
                    balances
                      .filter((i) => agingBucket(i.due_date) === b)
                      .reduce((s, i) => s + i.total - i.paid_amount, 0),
                  )}
                  color={b === "Current" ? "--st-booked" : "--st-cancelled"}
                />
              ))}
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
