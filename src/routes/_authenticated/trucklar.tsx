import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, TableShell, Th, Td, Empty } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList, useInvalidate } from "@/lib/tms";
import { equipmentTypes, axleOptions, truckStatusLabel } from "@/lib/equipment";

export const Route = createFileRoute("/_authenticated/trucklar")({
  head: () => ({
    meta: [
      { title: "Trucklar & Ekipman — HARU TMS" },
      { name: "description", content: "RGN, Double Drop, Flatbed, Step Deck ve tüm truck filosunu yönetin." },
      { property: "og:title", content: "Trucklar & Ekipman — HARU TMS" },
      { property: "og:description", content: "RGN, Double Drop, Flatbed, Step Deck ve tüm truck filosunu yönetin." },
    ],
  }),
  component: Trucks,
});

function Trucks() {
  const { data: trucks = [], isLoading } = useList("trucks", "unit_no", true);
  const drivers = useList("drivers", "full_name", true).data ?? [];
  const invalidate = useInvalidate();

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("trucks").update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    invalidate("trucks");
  }

  const counts = equipmentTypes.map((t) => [t, trucks.filter((x) => x.equipment_type === t).length] as const).filter(([, n]) => n);

  return (
    <>
      <PageHeader
        title="Trucklar & Ekipman"
        subtitle={`${trucks.length} unit · ${trucks.filter((t) => t.status === "active").length} aktif`}
        action={
          <AddDialog
            table="trucks"
            title="Truck"
            fields={[
              { name: "unit_no", label: "Unit #", required: true },
              { name: "equipment_type", label: "Trailer tipi", options: equipmentTypes.map((e) => ({ value: e, label: e })) },
              { name: "axles", label: "Aks sayısı", options: axleOptions.map((a) => ({ value: String(a), label: `${a} axle` })) },
              { name: "make", label: "Marka / Model" },
              { name: "model_year", label: "Yıl", type: "number" },
              { name: "vin", label: "VIN" },
              { name: "plate", label: "Plaka" },
              { name: "plate_state", label: "Eyalet (TX, GA…)" },
              { name: "deck_length_ft", label: "Deck uzunluğu (ft)", type: "number" },
              { name: "max_weight_lbs", label: "Maks. yük (lbs)", type: "number" },
            ]}
          />
        }
      />
      <div className="flex flex-wrap gap-2">
        {counts.map(([t, n]) => (
          <span key={t} className="rounded-full border bg-card px-3 py-1 text-xs"><b className="font-mono">{n}</b> {t}</span>
        ))}
      </div>
      <Panel title="Filo">
        {isLoading ? <Empty text="Yükleniyor…" /> : !trucks.length ? <Empty text="Henüz truck yok." /> : (
          <TableShell head={<><Th>Unit</Th><Th>Ekipman</Th><Th>Aks</Th><Th>Truck</Th><Th>Plaka</Th><Th>Deck / Kapasite</Th><Th>Sürücü</Th><Th>Durum</Th><Th /></>}>
            {trucks.map((t) => (
              <tr key={t.id}>
                <Td className="font-mono font-medium">{t.unit_no}</Td>
                <Td><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{t.equipment_type}</span></Td>
                <Td className="font-mono">{t.axles ? `${t.axles}-axle` : "—"}</Td>
                <Td className="text-muted-foreground">{t.make ?? "—"} {t.model_year ?? ""}</Td>
                <Td className="font-mono">{t.plate ?? "—"} <span className="text-muted-foreground">{t.plate_state}</span></Td>
                <Td className="font-mono text-xs">{t.deck_length_ft ? `${t.deck_length_ft} ft` : "—"} · {t.max_weight_lbs ? `${t.max_weight_lbs.toLocaleString("en-US")} lbs` : "—"}</Td>
                <Td>
                  <select value={t.driver_id ?? ""} onChange={(e) => update(t.id, { driver_id: e.target.value || null })} className="bg-transparent text-sm outline-none">
                    <option value="">— Atanmadı —</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </Td>
                <Td>
                  <select value={t.status} onChange={(e) => update(t.id, { status: e.target.value })} className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium outline-none">
                    {Object.entries(truckStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Td>
                <Td className="text-right"><DeleteBtn table="trucks" id={t.id} /></Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
