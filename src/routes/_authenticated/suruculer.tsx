import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, TableShell, Th, Td, Avatar, Empty } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList, useInvalidate, driverStatusLabel, type DriverStatus } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/suruculer")({
  head: () => ({
    meta: [
      { title: "Sürücüler — HARU TMS" },
      { name: "description", content: "Sürücü ekleyin, plaka ve durumlarını yönetin." },
      { property: "og:title", content: "Sürücüler — HARU TMS" },
      { property: "og:description", content: "Sürücü ekleyin, plaka ve durumlarını yönetin." },
    ],
  }),
  component: Suruculer,
});

function Suruculer() {
  const { data: drivers = [], isLoading } = useList("drivers", "full_name", true);
  const teams = useList("teams", "name", true).data ?? [];
  const invalidate = useInvalidate();
  const teamOpts = [{ value: "", label: "—" }, ...teams.map((t) => ({ value: t.id, label: t.name }))];

  async function setStatus(id: string, status: DriverStatus) {
    const { error } = await supabase.from("drivers").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    invalidate("drivers");
  }

  return (
    <>
      <PageHeader
        title="Sürücüler"
        subtitle={`${drivers.length} kayıtlı sürücü`}
        action={
          <AddDialog
            table="drivers"
            title="Sürücü"
            fields={[
              { name: "full_name", label: "Ad Soyad", required: true },
              { name: "phone", label: "Telefon", type: "tel" },
              { name: "license_no", label: "CDL No" },
              { name: "cdl_class", label: "CDL sınıfı", options: [{ value: "A", label: "CDL-A" }, { value: "B", label: "CDL-B" }] },
              { name: "current_city", label: "Mevcut konum (Dallas, TX)" },
              { name: "home_base", label: "Home base" },
              { name: "team_id", label: "Ekip", options: teamOpts },
            ]}
          />
        }
      />
      <Panel title="Sürücü Listesi">
        {isLoading ? <Empty text="Yükleniyor…" /> : !drivers.length ? <Empty text="Henüz sürücü yok." /> : (
          <TableShell head={<><Th>Sürücü</Th><Th>Telefon</Th><Th>Konum</Th><Th>CDL</Th><Th>Ekip</Th><Th>Durum</Th><Th /></>}>
            {drivers.map((d) => (
              <tr key={d.id}>
                <Td><span className="flex items-center gap-2.5"><Avatar name={d.full_name} /><span className="font-medium">{d.full_name}</span></span></Td>
                <Td className="text-muted-foreground">{d.phone ?? "—"}</Td>
                <Td>{d.current_city ?? "—"}</Td>
                <Td className="font-mono text-muted-foreground">{d.cdl_class ? `CDL-${d.cdl_class}` : ""} {d.license_no ?? ""}</Td>
                <Td>{teams.find((t) => t.id === d.team_id)?.name ?? "—"}</Td>
                <Td>
                  <select value={d.status} onChange={(e) => setStatus(d.id, e.target.value as DriverStatus)} className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium outline-none">
                    {Object.entries(driverStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Td>
                <Td className="text-right"><DeleteBtn table="drivers" id={d.id} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
