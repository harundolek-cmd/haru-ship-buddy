import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import { useRecords, errorText } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/tms";
import { PageHeader, Panel, Field, selectCls } from "@/components/tms/ui";
import { QueryNotice } from "@/components/tms/business/ResourceManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const Route = createFileRoute("/_authenticated/map")({ component: FleetMap });
function FleetMap() {
  const q = useRecords("drivers"),
    qc = useQueryClient(),
    { companyId } = useCurrentUser(),
    container = useRef<HTMLDivElement>(null);
  const [id, setId] = useState(""),
    [lat, setLat] = useState(""),
    [lng, setLng] = useState(""),
    [city, setCity] = useState(""),
    [busy, setBusy] = useState(false),
    [mapError, setMapError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    async function mount() {
      try {
        const L = await import("leaflet");
        if (cancelled || !container.current) return;
        map = L.map(container.current).setView([39, -98], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(map);
        const points: import("leaflet").LatLngTuple[] = [];
        for (const d of q.data ?? []) {
          if (
            d.lat === null ||
            d.lng === null ||
            !Number.isFinite(d.lat) ||
            !Number.isFinite(d.lng)
          )
            continue;
          const point: [number, number] = [d.lat, d.lng];
          points.push(point);
          const node = document.createElement("div");
          node.textContent = `${d.full_name} · ${d.current_city ?? "Unknown city"} · ${d.location_updated_at ? new Date(d.location_updated_at).toLocaleString() : "Update time unknown"}`;
          L.circleMarker(point, {
            radius: 9,
            color: "#5745df",
            fillColor: "#8575f0",
            fillOpacity: 0.85,
          })
            .addTo(map)
            .bindPopup(node);
        }
        if (points.length)
          map.fitBounds(L.latLngBounds(points), { padding: [35, 35], maxZoom: 10 });
      } catch {
        setMapError(true);
      }
    }
    mount();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [q.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!companyId || busy) return;
    const a = Number(lat),
      b = Number(lng);
    if (
      !lat ||
      !lng ||
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      Math.abs(a) > 90 ||
      Math.abs(b) > 180
    ) {
      toast.error("Enter valid coordinates");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("drivers")
        .update({
          lat: a,
          lng: b,
          current_city: city,
          location_updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select("id");
      if (error) throw error;
      if (!data.length) throw new Error("Location was not updated");
      await qc.invalidateQueries();
      toast.success("Location recorded");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Fleet Locations"
        subtitle="Last reported driver positions. Updates are manual until an ELD/GPS provider is connected; this is not live vehicle tracking."
      />
      {q.error && <QueryNotice error={q.error} />}
      <div
        ref={container}
        className="relative z-0 h-[420px] rounded-xl border bg-muted"
        aria-label="Map of last reported driver locations"
      />
      {mapError && (
        <p role="alert" className="text-sm text-destructive">
          The map could not load. Location records remain available below.
        </p>
      )}
      <Panel title="Record a location update">
        <form onSubmit={save} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Driver">
            <select
              required
              className={selectCls}
              value={id}
              onChange={(e) => setId(e.target.value)}
            >
              <option value="">Select…</option>
              {q.data?.map((d) => (
                <option value={d.id} key={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City / state">
            <Input required value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Latitude">
            <Input
              required
              type="number"
              step="any"
              min="-90"
              max="90"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </Field>
          <Field label="Longitude">
            <Input
              required
              type="number"
              step="any"
              min="-180"
              max="180"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </Field>
          <Button className="self-end" disabled={busy || !id}>
            {busy ? "Saving…" : "Update location"}
          </Button>
        </form>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {q.data?.map((d) => (
          <div className="panel p-4" key={d.id}>
            <h2 className="font-semibold">{d.full_name}</h2>
            <p className="text-sm">{d.current_city || "No location recorded"}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last reported:{" "}
              {d.location_updated_at ? new Date(d.location_updated_at).toLocaleString() : "Unknown"}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
