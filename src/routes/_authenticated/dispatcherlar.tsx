import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, TableShell, Th, Td, Avatar, Empty } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/dispatcherlar")({
  head: () => ({
    meta: [
      { title: "Dispatcherlar — HARU TMS" },
      { name: "description", content: "Dispatcher isimleri, iletişim bilgileri ve ekipleri." },
      { property: "og:title", content: "Dispatcherlar — HARU TMS" },
      { property: "og:description", content: "Dispatcher isimleri, iletişim bilgileri ve ekipleri." },
    ],
  }),
  component: Dispatcherlar,
});

function Dispatcherlar() {
  const { data: list = [], isLoading } = useList("dispatchers", "full_name", true);
  const teams = useList("teams", "name", true).data ?? [];
  const loads = useList("loads").data ?? [];
  const teamOpts = [{ value: "", label: "—" }, ...teams.map((t) => ({ value: t.id, label: t.name }))];
  return (
    <>
      <PageHeader
        title="Dispatcherlar"
        subtitle={`${list.length} dispatcher`}
        action={
          <AddDialog
            table="dispatchers"
            title="Dispatcher"
            fields={[
              { name: "full_name", label: "Ad Soyad", required: true },
              { name: "email", label: "E-posta", type: "email" },
              { name: "phone", label: "Telefon", type: "tel" },
              { name: "team_id", label: "Ekip", options: teamOpts },
            ]}
          />
        }
      />
      <Panel title="Dispatcher Listesi">
        {isLoading ? <Empty text="Yükleniyor…" /> : !list.length ? <Empty text="Henüz dispatcher yok." /> : (
          <TableShell head={<><Th>Dispatcher</Th><Th>E-posta</Th><Th>Telefon</Th><Th>Ekip</Th><Th>Aktif Görev</Th><Th /></>}>
            {list.map((d) => (
              <tr key={d.id}>
                <Td><span className="flex items-center gap-2.5"><Avatar name={d.full_name} /><span className="font-medium">{d.full_name}</span></span></Td>
                <Td className="text-muted-foreground">{d.email ?? "—"}</Td>
                <Td className="text-muted-foreground">{d.phone ?? "—"}</Td>
                <Td>{teams.find((t) => t.id === d.team_id)?.name ?? "—"}</Td>
                <Td className="font-mono">{loads.filter((l) => l.dispatcher_id === d.id && l.status !== "teslim_edildi").length}</Td>
                <Td className="text-right"><DeleteBtn table="dispatchers" id={d.id} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
