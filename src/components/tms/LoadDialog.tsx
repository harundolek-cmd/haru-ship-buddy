import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useList, useInvalidate, loadStatusLabel, loadStatusOrder, type LoadStatus } from "@/lib/tms";
import { equipmentTypes, isOversize, usd } from "@/lib/equipment";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, selectCls } from "./ui";

const empty = {
  broker: "", broker_mc: "", reference_no: "",
  shipper: "", origin: "", pickup_date: "",
  consignee: "", destination: "", delivery_date: "",
  commodity: "", weight_lbs: "", length_ft: "", width_ft: "", height_ft: "", pieces: "",
  equipment_type: "Flatbed", permits: "",
  miles: "", rate: "", detention: "", lumper: "",
  route_id: "", driver_id: "", truck_id: "", dispatcher_id: "",
  status: "rezerve" as LoadStatus, notes: "",
};

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">{n}</span>{title}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export function NewLoadButton() {
  const [open, setOpen] = useState(false);
  const routes = useList("routes", "name", true).data ?? [];
  const drivers = useList("drivers", "full_name", true).data ?? [];
  const trucks = useList("trucks", "unit_no", true).data ?? [];
  const dispatchers = useList("dispatchers", "full_name", true).data ?? [];
  const invalidate = useInvalidate();
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const num = (v: string) => (v ? Number(v) : null);

  const dims = { weight_lbs: num(f.weight_lbs), width_ft: num(f.width_ft), height_ft: num(f.height_ft), length_ft: num(f.length_ft) };
  const oversize = isOversize(dims);
  const total = (num(f.rate) ?? 0) + (num(f.detention) ?? 0) + (num(f.lumper) ?? 0);
  const rpm = num(f.miles) ? (num(f.rate) ?? 0) / num(f.miles)! : null;
  const fitTrucks = trucks.filter((t) => t.status === "active" && t.equipment_type === f.equipment_type);

  function pickRoute(id: string) {
    const r = routes.find((x) => x.id === id);
    setF({ ...f, route_id: id, origin: r?.origin ?? f.origin, destination: r?.destination ?? f.destination, miles: r?.distance_km?.toString() ?? f.miles });
  }
  function pickTruck(id: string) {
    const t = trucks.find((x) => x.id === id);
    setF({ ...f, truck_id: id, driver_id: t?.driver_id ?? f.driver_id });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("loads").insert({
      broker: f.broker || null, broker_mc: f.broker_mc || null, reference_no: f.reference_no || null,
      shipper: f.shipper || null, origin: f.origin, pickup_date: f.pickup_date || null,
      consignee: f.consignee || null, destination: f.destination, delivery_date: f.delivery_date || null,
      commodity: f.commodity || null, ...dims, pieces: num(f.pieces),
      equipment_type: f.equipment_type, oversize, permits: f.permits || null,
      miles: num(f.miles), distance_km: num(f.miles) ? Math.round(num(f.miles)! * 1.609) : null,
      rate: num(f.rate), detention: num(f.detention), lumper: num(f.lumper),
      route_id: f.route_id || null, driver_id: f.driver_id || null, truck_id: f.truck_id || null,
      dispatcher_id: f.dispatcher_id || null, status: f.status, notes: f.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    if (f.driver_id) await supabase.from("drivers").update({ status: "gorevde" }).eq("id", f.driver_id);
    toast.success("Load created");
    invalidate("loads"); invalidate("drivers");
    setF(empty); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 pl-2 pr-3"><span className="font-mono">＋</span> Build Load</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>Load Builder</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <Section n={1} title="Broker / Customer">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Broker"><Input value={f.broker} onChange={set("broker")} placeholder="TQL, CH Robinson…" /></Field>
              <Field label="MC #"><Input value={f.broker_mc} onChange={set("broker_mc")} /></Field>
              <Field label="Load / PO #"><Input value={f.reference_no} onChange={set("reference_no")} /></Field>
            </div>
          </Section>
          <Section n={2} title="Pickup & Delivery">
            <Field label="Saved lane (optional)">
              <select className={selectCls} value={f.route_id} onChange={(e) => pickRoute(e.target.value)}>
                <option value="">— Select —</option>
                {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.origin} → {r.destination})</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Shipper"><Input value={f.shipper} onChange={set("shipper")} /></Field>
              <Field label="Pickup city, state"><Input required value={f.origin} onChange={set("origin")} placeholder="Houston, TX" /></Field>
              <Field label="Pickup date"><Input type="date" value={f.pickup_date} onChange={set("pickup_date")} /></Field>
              <Field label="Consignee"><Input value={f.consignee} onChange={set("consignee")} /></Field>
              <Field label="Delivery city, state"><Input required value={f.destination} onChange={set("destination")} placeholder="Atlanta, GA" /></Field>
              <Field label="Delivery date"><Input type="date" value={f.delivery_date} onChange={set("delivery_date")} /></Field>
            </div>
          </Section>
          <Section n={3} title="Freight & Equipment">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Commodity"><Input value={f.commodity} onChange={set("commodity")} placeholder="Excavator, Steel coils…" /></Field>
              <Field label="Equipment">
                <select className={selectCls} value={f.equipment_type} onChange={(e) => setF({ ...f, equipment_type: e.target.value, truck_id: "" })}>
                  {equipmentTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Pieces"><Input type="number" value={f.pieces} onChange={set("pieces")} /></Field>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Weight (lbs)"><Input type="number" value={f.weight_lbs} onChange={set("weight_lbs")} /></Field>
              <Field label="Length (ft)"><Input type="number" step="0.1" value={f.length_ft} onChange={set("length_ft")} /></Field>
              <Field label="Width (ft)"><Input type="number" step="0.1" value={f.width_ft} onChange={set("width_ft")} /></Field>
              <Field label="Height (ft)"><Input type="number" step="0.1" value={f.height_ft} onChange={set("height_ft")} /></Field>
            </div>
            {oversize && (
              <div className="rounded-md border border-[var(--st-transit)]/40 bg-[var(--st-transit)]/10 p-2 text-xs text-foreground">
                ⚠ Oversize / Overweight — exceeds legal limits (48,000 lbs cargo · 8.5 ft wide · 8.5 ft tall on deck · 53 ft long). State permits required — add them on the Permits page.
                <Input className="mt-2" value={f.permits} onChange={set("permits")} placeholder="Permit states: TX, LA, MS…" />
              </div>
            )}
          </Section>
          <Section n={4} title="Rate">
            <div className="grid grid-cols-4 gap-3">
              <Field label="Miles"><Input type="number" value={f.miles} onChange={set("miles")} /></Field>
              <Field label="Linehaul ($)"><Input type="number" value={f.rate} onChange={set("rate")} /></Field>
              <Field label="Detention ($)"><Input type="number" value={f.detention} onChange={set("detention")} /></Field>
              <Field label="Lumper ($)"><Input type="number" value={f.lumper} onChange={set("lumper")} /></Field>
            </div>
            <div className="flex gap-6 font-mono text-xs text-muted-foreground">
              <span>Total: <b className="text-foreground">{usd(total)}</b></span>
              <span>RPM: <b className="text-foreground">{rpm ? `$${rpm.toFixed(2)}/mi` : "—"}</b></span>
            </div>
          </Section>
          <Section n={5} title="Dispatch">
            <div className="grid grid-cols-4 gap-3">
              <Field label={`Truck (${f.equipment_type})`}>
                <select className={selectCls} value={f.truck_id} onChange={(e) => pickTruck(e.target.value)}>
                  <option value="">—</option>
                  {fitTrucks.map((t) => <option key={t.id} value={t.id}>{t.unit_no} · {t.axles}ax</option>)}
                </select>
              </Field>
              <Field label="Driver">
                <select className={selectCls} value={f.driver_id} onChange={set("driver_id")}>
                  <option value="">Unassigned</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}{d.current_city ? ` · ${d.current_city}` : ""}</option>)}
                </select>
              </Field>
              <Field label="Dispatcher">
                <select className={selectCls} value={f.dispatcher_id} onChange={set("dispatcher_id")}>
                  <option value="">—</option>
                  {dispatchers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={selectCls} value={f.status} onChange={set("status")}>
                  {loadStatusOrder.map((k) => <option key={k} value={k}>{loadStatusLabel[k]}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes"><Input value={f.notes} onChange={set("notes")} /></Field>
          </Section>
          <Button type="submit">Create Load</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
