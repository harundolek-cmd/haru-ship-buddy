import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, TableShell, Th, Td, Empty, Avatar } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/dispatchers")({
  head: () => ({
    meta: [
      { title: "Dispatchers & Teams — HARU TMS" },
      { name: "description", content: "Manage dispatchers and dispatch teams." },
      { property: "og:title", content: "Dispatchers & Teams — HARU TMS" },
      { property: "og:description", content: "Manage dispatchers and dispatch teams." },
    ],
  }),
  component: Page,
});

function Page() {
  const dispatchers = useList("dispatchers", "full_name", true);
  const teams = useList("teams", "name", true).data ?? [];
  const loads = useList("loads").data ?? [];
  const drivers = useList("drivers").data ?? [];
  const teamOpts = [{ value: "", label: "No team" }, ...teams.map((t) => ({ value: t.id, label: t.name }))];

  return (
    <>
      <PageHeader
        title="Dispatchers & Teams"
        action={<>
          <AddDialog table="teams" title="Team" fields={[{ name: "name", label: "Team name", required: true }, { name: "region", label: "Region" }]} />
          <AddDialog table="dispatchers" title="Dispatcher" fields={[
            { name: "full_name", label: "Full name", required: true },
            { name: "email", label: "Email", type: "email" },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "team_id", label: "Team", options: teamOpts },
          ]} />
        </>}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {teams.map((t) => (
          <div key={t.id} className="panel p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.region ?? "—"}</div>
              </div>
              <DeleteBtn table="teams" id={t.id} />
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span><b className="font-mono text-foreground">{(dispatchers.data ?? []).filter((d) => d.team_id === t.id).length}</b> dispatchers</span>
              <span><b className="font-mono text-foreground">{drivers.filter((d) => d.team_id === t.id).length}</b> drivers</span>
            </div>
          </div>
        ))}
      </div>
      <Panel title="Dispatchers">
        {!dispatchers.data?.length ? <Empty text="No dispatchers yet." /> : (
          <TableShell head={<><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Team</Th><Th className="text-right">Active loads</Th><Th /></>}>
            {dispatchers.data.map((d) => (
              <tr key={d.id}>
                <Td><span className="flex items-center gap-2"><Avatar name={d.full_name} />{d.full_name}</span></Td>
                <Td>{d.email ?? "—"}</Td><Td className="font-mono">{d.phone ?? "—"}</Td>
                <Td>{teams.find((t) => t.id === d.team_id)?.name ?? "—"}</Td>
                <Td className="text-right font-mono">{loads.filter((l) => l.dispatcher_id === d.id && ["rezerve", "sevk_edildi", "yolda"].includes(l.status)).length}</Td>
                <Td className="text-right"><DeleteBtn table="dispatchers" id={d.id} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
