import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Avatar, DriverStatusPill } from "@/components/tms/ui";
import { useList, useInvalidate } from "@/lib/tms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/harita")({
  head: () => ({
    meta: [
      { title: "Canlı Harita — HARU TMS" },
      { name: "description", content: "Sürücülerin ABD genelindeki anlık konumları." },
      { property: "og:title", content: "Canlı Harita — HARU TMS" },
      { property: "og:description", content: "Sürücülerin ABD genelindeki anlık konumları." },
    ],
    links: [{ rel: "stylesheet", href: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" }],
  }),
  component: Harita,
});

const statusColor: Record<string, string> = { musait: "#1F5C4A", gorevde: "#C17B3A", izinli: "#8a8a8a" };

function Harita() {
  const { data: drivers = [] } = useList("drivers", "full_name", true);
  const trucks = useList("trucks").data ?? [];
  const invalidate = useInvalidate();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layer = useRef<import("leaflet").LayerGroup | null>(null);
  const [L, setL] = useState<typeof import("leaflet") | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);
  const placingRef = useRef(placing);
  placingRef.current = placing;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      const Lf = mod.default ?? mod;
      const m = Lf.map(el.current).setView([38.5, -96], 4);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(m);
      layer.current = Lf.layerGroup().addTo(m);
      m.on("click", async (e) => {
        const id = placingRef.current;
        if (!id) return;
        const { error } = await supabase.from("drivers").update({ lat: e.latlng.lat, lng: e.latlng.lng, location_updated_at: new Date().toISOString() }).eq("id", id);
        if (error) toast.error(error.message); else toast.success("Konum güncellendi");
        setPlacing(null);
        invalidate("drivers");
      });
      map.current = m;
      setL(Lf);
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!L || !layer.current) return;
    layer.current.clearLayers();
    for (const d of drivers) {
      if (d.lat == null || d.lng == null) continue;
      const t = trucks.find((x) => x.driver_id === d.id);
      const c = statusColor[d.status] ?? "#333";
      const icon = L.divIcon({
        className: "",
        html: `<div style="background:${c};color:#fff;border:2px solid #fff;border-radius:999px;padding:2px 7px;font:600 11px 'IBM Plex Mono',monospace;box-shadow:0 2px 6px rgba(0,0,0,.3);white-space:nowrap">${t?.unit_no ?? "🚚"}</div>`,
        iconSize: [60, 22], iconAnchor: [30, 11],
      });
      L.marker([d.lat, d.lng], { icon })
        .bindPopup(`<b>${d.full_name}</b><br/>${d.current_city ?? ""}<br/>${t ? `${t.unit_no} · ${t.equipment_type} ${t.axles ?? ""}ax` : "Truck yok"}`)
        .on("click", () => setSelected(d.id))
        .addTo(layer.current);
    }
  }, [L, drivers, trucks]);

  function focus(id: string) {
    const d = drivers.find((x) => x.id === id);
    setSelected(id);
    if (d?.lat != null && d.lng != null) map.current?.flyTo([d.lat, d.lng], 8);
  }

  return (
    <>
      <PageHeader title="Canlı Harita" subtitle="Sürücüler nerede — ABD geneli filo görünümü" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Panel className="xl:col-span-3 overflow-hidden">
          {placing && <div className="mb-2 rounded bg-accent/10 px-3 py-2 text-xs text-accent">Haritada yeni konuma tıklayın… <button className="underline" onClick={() => setPlacing(null)}>İptal</button></div>}
          <div ref={el} className={cn("h-[640px] w-full rounded-md", placing && "cursor-crosshair")} />
        </Panel>
        <Panel title="Sürücüler">
          <div className="max-h-[640px] space-y-1 overflow-y-auto">
            {drivers.map((d) => {
              const t = trucks.find((x) => x.driver_id === d.id);
              return (
                <div key={d.id} onClick={() => focus(d.id)} className={cn("cursor-pointer rounded-md p-2 hover:bg-foreground/5", selected === d.id && "bg-primary/10")}>
                  <div className="flex items-center gap-2">
                    <Avatar name={d.full_name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{d.full_name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{d.current_city ?? "Konum yok"} · {t ? `${t.unit_no} ${t.equipment_type}` : "—"}</div>
                    </div>
                    <DriverStatusPill status={d.status} />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setPlacing(d.id); }} className="mt-1 text-[11px] text-primary hover:underline">📍 Konumu güncelle</button>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}
