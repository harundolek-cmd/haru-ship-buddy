import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, TableShell, Th, Td, Empty } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/rotalar")({
  head: () => ({
    meta: [
      { title: "Rotalar — HARU TMS" },
      { name: "description", content: "Sık kullanılan rotaları kaydedin ve görevlerde kullanın." },
      { property: "og:title", content: "Rotalar — HARU TMS" },
      { property: "og:description", content: "Sık kullanılan rotaları kaydedin ve görevlerde kullanın." },
    ],
  }),
  component: Rotalar,
});

function Rotalar() {
  const { data: routes = [], isLoading } = useList("routes", "name", true);
  const loads = useList("loads").data ?? [];
  return (
    <>
      <PageHeader
        title="Rotalar"
        subtitle="Kayıtlı hatlar ve mesafeler"
        action={
          <AddDialog
            table="routes"
            title="Rota"
            fields={[
              { name: "name", label: "Rota adı", required: true },
              { name: "origin", label: "Çıkış", required: true },
              { name: "destination", label: "Varış", required: true },
              { name: "distance_km", label: "Mesafe (km)", type: "number" },
              { name: "notes", label: "Not" },
            ]}
          />
        }
      />
      <Panel title="Rota Listesi">
        {isLoading ? <Empty text="Yükleniyor…" /> : !routes.length ? <Empty text="Henüz rota yok." /> : (
          <TableShell head={<><Th>Rota</Th><Th>Güzergah</Th><Th>Mesafe</Th><Th>Görev</Th><Th>Not</Th><Th /></>}>
            {routes.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.name}</Td>
                <Td>{r.origin} → {r.destination}</Td>
                <Td className="font-mono">{r.distance_km ? `${r.distance_km} km` : "—"}</Td>
                <Td className="font-mono">{loads.filter((l) => l.route_id === r.id).length}</Td>
                <Td className="text-muted-foreground">{r.notes ?? "—"}</Td>
                <Td className="text-right"><DeleteBtn table="routes" id={r.id} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
