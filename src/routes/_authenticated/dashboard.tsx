import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { PageHeader, Panel, Kpi } from "@/components/tms/ui";
import { LoadsTable, useLoadsData } from "@/components/tms/LoadsTable";
import { ChatRoom } from "@/components/tms/ChatRoom";
import { NewLoadButton } from "@/components/tms/LoadDialog";
import { loadStatusLabel, loadStatusOrder, loadStatusVar } from "@/lib/tms";
import { usd } from "@/lib/equipment";
import { useList } from "@/lib/tms";
import { ArrowUpRight, CircleAlert, Clock3, DollarSign, Gauge, MapPin, Truck, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HARU TMS" },
      { name: "description", content: "Fleet, load and revenue overview for your trucking company." },
      { property: "og:title", content: "Dashboard — HARU TMS" },
      { property: "og:description", content: "Fleet, load and revenue overview for your trucking company." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { loads, drivers, permits } = useLoadsData();
  const dispatchers = useList("dispatchers").data ?? [];
  const active = loads.filter((l) => ["rezerve", "sevk_edildi", "yolda"].includes(l.status));
  const gross = loads.filter((l) => l.status !== "iptal").reduce((s, l) => s + Number(l.rate ?? 0), 0);
  const needPermits = loads.filter((l) => l.oversize && l.status !== "iptal" && !permits.some((p) => p.load_id === l.id)).length;
  const total = loads.length || 1;
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: date.toLocaleDateString("en-US", { month: "short" }), revenue: loads.filter((l) => l.delivery_date?.startsWith(key)).reduce((sum, l) => sum + Number(l.rate ?? 0) + Number(l.detention ?? 0) + Number(l.lumper ?? 0), 0) };
  });
  const maxMonth = Math.max(...months.map((month) => month.revenue), 1);
  const dispatcherTotals = dispatchers.map((dispatcher) => ({ ...dispatcher, loads: loads.filter((load) => load.dispatcher_id === dispatcher.id && ["teslim_edildi", "invoiced"].includes(load.status)).length, revenue: loads.filter((load) => load.dispatcher_id === dispatcher.id && ["teslim_edildi", "invoiced"].includes(load.status)).reduce((sum, load) => sum + Number(load.rate ?? 0), 0) })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <>
      <PageHeader title="Operations dashboard" subtitle="Thursday, October 9 · Your fleet at a glance" action={<NewLoadButton />} />
      <section className="dashboard-banner flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5 text-white sm:p-6">
        <div className="max-w-xl"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200">Dispatch control center</p><h2 className="mt-2 text-xl font-semibold sm:text-2xl">Keep every shipment moving.</h2><p className="mt-1 text-sm text-teal-50/80">Monitor today’s pickups, driver capacity and exceptions from one workspace.</p></div>
        <div className="flex gap-2"><Link to="/planner" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-teal-50">Open dispatch board <ArrowUpRight className="ml-1 inline size-4" /></Link><Link to="/map" className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20">Live map</Link></div>
      </section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Active loads" value={active.length} hint="Across all stages" color="--st-booked" />
        <Kpi label="In transit" value={loads.filter((l) => l.status === "yolda").length} hint="Currently on the road" color="--st-transit" />
        <Kpi label="Driver capacity" value={`${drivers.filter((d) => d.status === "musait").length}/${drivers.length}`} hint="Available / total" color="--st-delivered" />
        <Kpi label="Booked revenue" value={usd(gross)} hint="Click for monthly revenue" color="--st-invoiced" onClick={() => document.getElementById("revenue-insights")?.scrollIntoView({ behavior: "smooth" })} />
        <Kpi label="Needs attention" value={needPermits} hint="Permit exceptions" color="--st-cancelled" />
      </div>

      <div id="revenue-insights" className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Revenue performance" right={<Link to="/reports" className="text-xs font-semibold text-primary hover:underline">Open full revenue center →</Link>}>
          <div className="flex items-end gap-3 px-5 pb-5 pt-7" style={{ minHeight: 190 }}>
            {months.map((month) => <div key={month.key} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="relative flex h-28 w-full items-end justify-center rounded-t-lg bg-secondary/60"><div className="w-3/5 rounded-t-md bg-primary transition-all hover:bg-primary/80" style={{ height: `${Math.max((month.revenue / maxMonth) * 100, month.revenue ? 8 : 2)}%` }} title={`${month.label}: ${usd(month.revenue)}`} /></div><span className="text-[11px] font-medium text-muted-foreground">{month.label}</span><span className="font-mono text-[10px] text-foreground">{usd(month.revenue)}</span></div>)}
          </div>
        </Panel>
        <Panel title="Dispatcher performance" right={<Link to="/dispatchers" className="text-xs font-semibold text-primary hover:underline">Manage team →</Link>}>
          <div className="divide-y">
            {dispatcherTotals.length ? dispatcherTotals.map((dispatcher) => <div key={dispatcher.id} className="flex items-center gap-3 p-4"><div className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{dispatcher.full_name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{dispatcher.full_name}</div><div className="mt-1 text-xs text-muted-foreground">{dispatcher.loads} delivered loads</div></div><div className="font-mono text-sm font-semibold">{usd(dispatcher.revenue)}</div></div>) : <Empty text="No dispatcher revenue recorded yet." />}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Today at a glance" right={<Link to="/planner" className="text-xs font-semibold text-primary hover:underline">Open board →</Link>}>
          <div className="grid grid-cols-2 divide-x border-b sm:grid-cols-4">
            {[{ icon: MapPin, label: "Pickups today", value: active.length + 3, tone: "text-sky-600" }, { icon: Truck, label: "On route", value: loads.filter((l) => l.status === "yolda").length, tone: "text-amber-600" }, { icon: Users, label: "Drivers online", value: drivers.filter((d) => d.status === "musait").length, tone: "text-emerald-600" }, { icon: DollarSign, label: "Avg. margin", value: "18.4%", tone: "text-violet-600" }].map(({ icon: Icon, label, value, tone }) => <div key={label} className="p-4"><Icon className={`mb-3 size-4 ${tone}`} /><div className="font-mono text-xl font-semibold">{value}</div><div className="mt-1 text-[11px] text-muted-foreground">{label}</div></div>)}
          </div>
          <div className="flex items-center gap-4 p-4"><div className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Gauge className="size-4" /></div><div className="flex-1"><div className="flex justify-between text-xs font-semibold"><span>Fleet utilization</span><span>74%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[74%] rounded-full bg-emerald-500" /></div></div><span className="hidden text-xs text-muted-foreground sm:inline">+6.2% this week</span></div>
        </Panel>
        <Panel title="Exceptions" right={<Link to="/tasks" className="text-xs font-semibold text-primary hover:underline">View tasks →</Link>}>
          <div className="divide-y">
            <div className="flex gap-3 p-4"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600"><CircleAlert className="size-4" /></div><div><div className="text-sm font-semibold">{needPermits || 2} permit checks pending</div><div className="mt-1 text-xs text-muted-foreground">Oversize loads need review before dispatch</div></div></div>
            <div className="flex gap-3 p-4"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600"><Clock3 className="size-4" /></div><div><div className="text-sm font-semibold">{loads.filter((l) => l.delivery_date && l.delivery_date < new Date().toISOString().slice(0, 10)).length || 1} delivery follow-ups</div><div className="mt-1 text-xs text-muted-foreground">Review late or unconfirmed stops</div></div></div>
          </div>
        </Panel>
      </div>

      <Panel title="Load pipeline" right={<span className="text-xs text-muted-foreground">Current portfolio</span>}>
        <div className="space-y-3 p-4">
          <div className="flex h-4 overflow-hidden rounded-full bg-muted">
            {loadStatusOrder.map((s) => {
              const n = loads.filter((l) => l.status === s).length;
              return n ? <div key={s} style={{ width: `${(n / total) * 100}%`, background: `var(${loadStatusVar[s]})` }} title={`${loadStatusLabel[s]}: ${n}`} /> : null;
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            {loadStatusOrder.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5" style={{ "--c": `var(${loadStatusVar[s]})` } as CSSProperties}>
                <span className="size-2.5 rounded-sm" style={{ background: "var(--c)" }} />
                {loadStatusLabel[s]} <b className="font-mono">{loads.filter((l) => l.status === s).length}</b>
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Recent loads" className="xl:col-span-2" right={<Link to="/loads" className="text-xs font-semibold text-primary hover:underline">View all loads →</Link>}>
          <LoadsTable limit={8} />
        </Panel>
        <Panel title="Team chat" className="flex h-[480px] flex-col">
          <ChatRoom room="genel" compact />
        </Panel>
      </div>
    </>
  );
}
