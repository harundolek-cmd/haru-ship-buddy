import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useRecords, today } from "@/lib/business";
import { loadNo, loadStatusLabel, loadStatusOrder, loadStatusVar } from "@/lib/tms";
import { PageHeader, Empty, LoadStatusPill } from "@/components/tms/ui";
import { Input } from "@/components/ui/input";
import { QueryNotice } from "@/components/tms/business/ResourceManager";
import { NewLoadButton } from "@/components/tms/LoadDialog";
export const Route = createFileRoute("/_authenticated/planner")({ component: Planner });
function Planner() {
  const q = useRecords("loads"),
    drivers = useRecords("drivers").data ?? [];
  const [date, setDate] = useState(""),
    [search, setSearch] = useState("");
  const rows = (q.data ?? []).filter(
    (l) =>
      (!date || l.pickup_date === date || l.delivery_date === date) &&
      [l.origin, l.destination, l.broker, loadNo(l.load_no)].some((x) =>
        x?.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  return (
    <>
      <PageHeader
        title="Dispatch Board"
        subtitle="Plan by load status, inspect assignments and identify overdue deliveries."
        action={<NewLoadButton />}
      />
      <div className="flex flex-wrap gap-3">
        <Input
          aria-label="Search dispatch board"
          className="max-w-sm bg-card"
          placeholder="Search lane, broker or load…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          aria-label="Pickup or delivery date"
          type="date"
          className="max-w-48 bg-card"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="text-sm text-primary"
          onClick={() => {
            setDate("");
            setSearch("");
          }}
        >
          Clear filters
        </button>
      </div>
      {q.error ? (
        <QueryNotice error={q.error} />
      ) : q.isLoading ? (
        <Empty text="Loading dispatch board…" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loadStatusOrder.map((status) => (
            <section
              key={status}
              className="rounded-xl border bg-card/60 p-3"
              style={{ borderTop: `3px solid var(${loadStatusVar[status]})` }}
            >
              <h2 className="mb-3 flex justify-between text-sm font-semibold">
                {loadStatusLabel[status]}
                <span className="rounded-full bg-muted px-2">
                  {rows.filter((l) => l.status === status).length}
                </span>
              </h2>
              <div className="space-y-3">
                {rows
                  .filter((l) => l.status === status)
                  .map((l) => (
                    <article key={l.id} className="panel space-y-3 p-4">
                      <div className="flex justify-between gap-2">
                        <span className="font-mono text-xs font-semibold">{loadNo(l.load_no)}</span>
                        <LoadStatusPill status={l.status} />
                      </div>
                      <p className="text-sm font-semibold">
                        {l.origin} → {l.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.broker || "No broker"} · {l.equipment_type}
                      </p>
                      <p className="text-xs">
                        {drivers.find((d) => d.id === l.driver_id)?.full_name ||
                          "Driver unassigned"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pickup {l.pickup_date || "—"} · Delivery {l.delivery_date || "—"}
                      </p>
                      {l.delivery_date &&
                        l.delivery_date < today() &&
                        !["teslim_edildi", "invoiced", "iptal"].includes(l.status) && (
                          <p className="text-xs font-semibold text-destructive">
                            Delivery date overdue — confirm status
                          </p>
                        )}
                      <div className="flex items-center justify-between">
                        <NewLoadButton initialLoad={l} />
                        <Link
                          to="/print/$doc/$loadId"
                          params={{ doc: "bol", loadId: l.id }}
                          className="text-xs text-primary"
                        >
                          Shipment summary
                        </Link>
                      </div>
                    </article>
                  ))}
                {!rows.some((l) => l.status === status) && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No loads in this stage
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
