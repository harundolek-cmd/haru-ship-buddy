import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/tms/ui";
import { LoadsTable, LoadFilters, useLoadsData } from "@/components/tms/LoadsTable";
import { NewLoadButton } from "@/components/tms/LoadDialog";
import { Input } from "@/components/ui/input";
import type { LoadStatus } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/loads")({
  head: () => ({
    meta: [
      { title: "Loads — HARU TMS" },
      { name: "description", content: "Build, dispatch and track loads with BOL/POD, rate cons and invoices." },
      { property: "og:title", content: "Loads — HARU TMS" },
      { property: "og:description", content: "Build, dispatch and track loads with BOL/POD, rate cons and invoices." },
    ],
  }),
  component: LoadsPage,
});

function LoadsPage() {
  const [filter, setFilter] = useState<"all" | LoadStatus>("all");
  const [search, setSearch] = useState("");
  const { loads } = useLoadsData();
  const counts: Record<string, number> = { all: loads.length };
  for (const l of loads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <>
      <PageHeader title="Loads" subtitle="Change status inline, upload BOL/POD, generate BOL · Rate Con · Invoice" action={<NewLoadButton />} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LoadFilters value={filter} onChange={setFilter} counts={counts} />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search load #, city, broker, PO…" className="h-8 w-72 bg-card" />
      </div>
      <Panel><LoadsTable filter={filter} search={search} editable /></Panel>
    </>
  );
}
