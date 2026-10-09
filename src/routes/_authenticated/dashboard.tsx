import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { PageHeader, Panel, Kpi } from "@/components/tms/ui";
import { LoadsTable, useLoadsData } from "@/components/tms/LoadsTable";
import { ChatRoom } from "@/components/tms/ChatRoom";
import { NewLoadButton } from "@/components/tms/LoadDialog";
import { loadStatusLabel, loadStatusOrder, loadStatusVar } from "@/lib/tms";
import { usd } from "@/lib/equipment";
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
  const active = loads.filter((l) => ["rezerve", "sevk_edildi", "yolda"].includes(l.status));
  const gross = loads.filter((l) => l.status !== "iptal").reduce((s, l) => s + Number(l.rate ?? 0), 0);
  const needPermits = loads.filter((l) => l.oversize && l.status !== "iptal" && !permits.some((p) => p.load_id === l.id)).length;
  const total = loads.length || 1;

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
        <Kpi label="Booked revenue" value={usd(gross)} hint="Current load value" color="--st-invoiced" />
        <Kpi label="Needs attention" value={needPermits} hint="Permit exceptions" color="--st-cancelled" />
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
