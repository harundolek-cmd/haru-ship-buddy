import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { PageHeader, Panel, Kpi } from "@/components/tms/ui";
import { LoadsTable, useLoadsData } from "@/components/tms/LoadsTable";
import { ChatRoom } from "@/components/tms/ChatRoom";
import { NewLoadButton } from "@/components/tms/LoadDialog";
import { loadStatusLabel, loadStatusOrder, loadStatusVar } from "@/lib/tms";
import { usd } from "@/lib/equipment";

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
      <PageHeader title="Dashboard" subtitle="Today's operations at a glance" action={<NewLoadButton />} />
      <section className="dashboard-banner flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 text-white sm:p-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Dispatch overview</p>
          <h2 className="mt-2 text-xl font-semibold sm:text-2xl">Every load. One clear view.</h2>
          <p className="mt-1 text-sm text-indigo-100">Your fleet, your team, your next move.</p>
        </div>
        <Link to="/loads" className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Open load board →</Link>
      </section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Active loads" value={active.length} color="--st-booked" />
        <Kpi label="In transit" value={loads.filter((l) => l.status === "yolda").length} color="--st-transit" />
        <Kpi label="Available drivers" value={`${drivers.filter((d) => d.status === "musait").length}/${drivers.length}`} color="--st-delivered" />
        <Kpi label="Gross revenue" value={usd(gross)} color="--st-invoiced" />
        <Kpi label="Permits needed" value={needPermits} hint="Oversize loads without permits" color="--st-cancelled" />
      </div>

      <Panel title="Load pipeline">
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
        <Panel title="Recent loads" className="xl:col-span-2" right={<Link to="/loads" className="text-xs text-primary hover:underline">View all →</Link>}>
          <LoadsTable limit={8} />
        </Panel>
        <Panel title="Team chat" className="flex h-[480px] flex-col">
          <ChatRoom room="genel" compact />
        </Panel>
      </div>
    </>
  );
}
