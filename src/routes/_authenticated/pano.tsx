import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/tms/ui";
import { NewLoadButton } from "@/components/tms/LoadDialog";
import { LoadsTable, LoadFilters, useLoadsData } from "@/components/tms/LoadsTable";
import { ChatRoom } from "@/components/tms/ChatRoom";
import type { LoadStatus } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/pano")({
  head: () => ({
    meta: [
      { title: "Sevk Pano — HARU TMS" },
      { name: "description", content: "Filonun anlık operasyon durumu." },
      { property: "og:title", content: "Sevk Pano — HARU TMS" },
      { property: "og:description", content: "Filonun anlık operasyon durumu." },
    ],
  }),
  component: Pano,
});

function Kpi({ label, value, note, tone = "text-primary" }: { label: string; value: number | string; note: string; tone?: string }) {
  return (
    <div className="panel p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-3xl font-semibold tracking-tight">{value}</div>
      <div className={`mt-2 text-xs font-medium ${tone}`}>{note}</div>
    </div>
  );
}

function Pano() {
  const [filter, setFilter] = useState<"all" | LoadStatus>("all");
  const { loads, drivers } = useLoadsData();
  const active = loads.filter((l) => l.status !== "teslim_edildi" && l.status !== "iptal").length;
  const transit = loads.filter((l) => l.status === "yolda").length;
  const delivered = loads.filter((l) => l.status === "teslim_edildi").length;
  const free = drivers.filter((d) => d.status === "musait").length;
  const busy = drivers.filter((d) => d.status === "gorevde").length;
  const pct = loads.length ? Math.round((delivered / loads.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Sevk Pano" subtitle="Filonun anlık operasyon durumu" action={<NewLoadButton />} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Aktif Görev" value={active} note={`▲ ${loads.length} toplam`} />
        <Kpi label="Yolda" value={transit} note="Canlı takip" tone="text-muted-foreground" />
        <Kpi label="Teslim Edildi" value={delivered} note={`▲ %${pct} tamamlanma`} />
        <Kpi label="Müsait Sürücü" value={free} note={`▼ ${busy} meşgul`} tone="text-accent" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Görev Akışı" right={<LoadFilters value={filter} onChange={setFilter} total={loads.length} />} className="xl:col-span-2">
          <LoadsTable filter={filter} limit={8} />
        </Panel>
        <Panel title="Ekip Sohbeti" right={<span className="font-mono text-[11px] text-muted-foreground">Genel</span>} className="flex flex-col">
          <div className="h-[420px]"><ChatRoom room="genel" compact /></div>
        </Panel>
      </div>
    </>
  );
}
