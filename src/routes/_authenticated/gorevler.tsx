import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/tms/ui";
import { NewLoadButton } from "@/components/tms/LoadDialog";
import { LoadsTable, LoadFilters, useLoadsData } from "@/components/tms/LoadsTable";
import type { LoadStatus } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/gorevler")({
  head: () => ({
    meta: [
      { title: "Görevler — HARU TMS" },
      { name: "description", content: "Tüm yükleri yönetin, durum güncelleyin ve BOL/POD yükleyin." },
      { property: "og:title", content: "Görevler — HARU TMS" },
      { property: "og:description", content: "Tüm yükleri yönetin, durum güncelleyin ve BOL/POD yükleyin." },
    ],
  }),
  component: Gorevler,
});

function Gorevler() {
  const [filter, setFilter] = useState<"all" | LoadStatus>("all");
  const { loads } = useLoadsData();
  return (
    <>
      <PageHeader title="Görevler" subtitle="Durumu değiştirin, BOL ve POD belgelerini yükleyin" action={<NewLoadButton />} />
      <Panel title="Tüm Görevler" right={<LoadFilters value={filter} onChange={setFilter} total={loads.length} />}>
        <LoadsTable filter={filter} editable />
      </Panel>
    </>
  );
}
