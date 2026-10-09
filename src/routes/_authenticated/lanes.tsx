import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, TableShell, Th, Td, Empty } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/lanes")({
  head: () => ({
    meta: [
      { title: "Lanes — HARU TMS" },
      { name: "description", content: "Saved US freight lanes for faster load building." },
      { property: "og:title", content: "Lanes — HARU TMS" },
      { property: "og:description", content: "Saved US freight lanes for faster load building." },
    ],
  }),
  component: LanesPage,
});

function LanesPage() {
  const { data = [], isLoading } = useList("routes", "name", true);
  return (
    <>
      <PageHeader
        title="Lanes"
        subtitle="Saved origin → destination lanes"
        action={<AddDialog table="routes" title="Lane" fields={[
          { name: "name", label: "Lane name", required: true },
          { name: "origin", label: "Origin (City, ST)", required: true },
          { name: "destination", label: "Destination (City, ST)", required: true },
          { name: "distance_km", label: "Miles", type: "number" },
          { name: "notes", label: "Notes" },
        ]} />}
      />
      <Panel>
        {isLoading ? <Empty text="Loading…" /> : !data.length ? <Empty text="No lanes yet." /> : (
          <TableShell head={<><Th>Lane</Th><Th>Origin</Th><Th>Destination</Th><Th className="text-right">Miles</Th><Th>Notes</Th><Th /></>}>
            {data.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.name}</Td><Td>{r.origin}</Td><Td>{r.destination}</Td>
                <Td className="text-right font-mono">{r.distance_km?.toLocaleString() ?? "—"}</Td>
                <Td className="text-muted-foreground">{r.notes ?? ""}</Td>
                <Td className="text-right"><DeleteBtn table="routes" id={r.id} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
