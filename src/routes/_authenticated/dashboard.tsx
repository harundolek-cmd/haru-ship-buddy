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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Active loads" value={active.length} color="--st-booked" />
        <Kpi label="In transit" value={loads.filter((l) => l.status === "yolda").length} color="--st-transit" />
        <Kpi label="Available drivers" value={`${drivers.filter((d) => d.status === "musait").length}/${drivers.length}`} color="--st-delivered" />
        <Kpi label="Gross revenue" value={usd(gross)} color="--st-invoiced" />
        <Kpi label="Permits needed" value={needPermits} hint="Oversize loads without permits" color="--st-cancelled" />
      </div>

      <Panel title="Load pipeline">
        <div className="space-y-3 p-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
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
