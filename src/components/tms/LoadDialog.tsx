import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useList,
  useInvalidate,
  loadStatusLabel,
  loadStatusOrder,
  type LoadStatus,
  type Tables,
  useCurrentUser,
} from "@/lib/tms";
import { equipmentTypes, isOversize, usd } from "@/lib/equipment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, selectCls } from "./ui";
import { AddressAutocomplete } from "./AddressAutocomplete";

const empty = {
  broker: "",
  broker_mc: "",
  reference_no: "",
  shipper: "",
  origin: "",
  pickup_date: "",
  consignee: "",
  destination: "",
  delivery_date: "",
  commodity: "",
  weight_lbs: "",
  length_ft: "",
  width_ft: "",
  height_ft: "",
  pieces: "",
  equipment_type: "Flatbed",
  permits: "",
  miles: "",
  rate: "",
  detention: "",
  lumper: "",
  route_id: "",
  driver_id: "",
  truck_id: "",
  dispatcher_id: "",
  status: "rezerve" as LoadStatus,
  notes: "",
};

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background/50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="grid size-5 place-items-center rounded-full bg-primary font-mono text-[10px] text-primary-foreground">
          {n}
        </span>
        {title}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export function NewLoadButton({ initialLoad }: { initialLoad?: Tables<"loads"> } = {}) {
  const { companyId } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const loadInitial = () =>
    initialLoad
      ? (Object.fromEntries(
          Object.entries(empty).map(([k, v]) => [
            k,
            String(initialLoad[k as keyof typeof initialLoad] ?? v),
          ]),
        ) as typeof empty)
      : empty;
  const [open, setOpen] = useState(false);
  const routes = useList("routes", "name", true).data ?? [];
  const drivers = useList("drivers", "full_name", true).data ?? [];
  const trucks = useList("trucks", "unit_no", true).data ?? [];
  const dispatchers = useList("dispatchers", "full_name", true).data ?? [];
  const invalidate = useInvalidate();
  const [f, setF] = useState(loadInitial);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const num = (v: string) => (v ? Number(v) : null);

  const dims = {
    weight_lbs: num(f.weight_lbs),
    width_ft: num(f.width_ft),
    height_ft: num(f.height_ft),
    length_ft: num(f.length_ft),
  };
  const oversize = isOversize(dims);
  const total = (num(f.rate) ?? 0) + (num(f.detention) ?? 0) + (num(f.lumper) ?? 0);
  const rpm = num(f.miles) ? (num(f.rate) ?? 0) / num(f.miles)! : null;
  const fitTrucks = trucks.filter(
    (t) => t.status === "active" && t.equipment_type === f.equipment_type,
  );

  function pickRoute(id: string) {
    const r = routes.find((x) => x.id === id);
    setF({
      ...f,
      route_id: id,
      origin: r?.origin ?? f.origin,
      destination: r?.destination ?? f.destination,
      miles: r?.distance_km ? Math.round(r.distance_km / 1.609).toString() : f.miles,
    });
  }
  function pickTruck(id: string) {
    const t = trucks.find((x) => x.id === id);
    setF({ ...f, truck_id: id, driver_id: t?.driver_id ?? f.driver_id });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving || !companyId) return;
    if (f.pickup_date && f.delivery_date && f.delivery_date < f.pickup_date) {
      toast.error("Delivery date cannot precede pickup");
      return;
    }
    const numericFields = [
      f.weight_lbs,
      f.length_ft,
      f.width_ft,
      f.height_ft,
      f.pieces,
      f.miles,
      f.rate,
      f.detention,
      f.lumper,
    ];
    if (numericFields.some((v) => v && (!Number.isFinite(Number(v)) || Number(v) < 0))) {
      toast.error("Numeric values must be nonnegative");
      return;
    }
    setSaving(true);
    const payload = {
      broker: f.broker || null,
      broker_mc: f.broker_mc || null,
      reference_no: f.reference_no || null,
      shipper: f.shipper || null,
      origin: f.origin,
      pickup_date: f.pickup_date || null,
      consignee: f.consignee || null,
      destination: f.destination,
      delivery_date: f.delivery_date || null,
      commodity: f.commodity || null,
      ...dims,
      pieces: num(f.pieces),
      equipment_type: f.equipment_type,
      oversize,
      permits: f.permits || null,
      miles: num(f.miles),
      distance_km: num(f.miles) ? Math.round(num(f.miles)! * 1.609) : null,
      rate: num(f.rate),
      detention: num(f.detention),
      lumper: num(f.lumper),
      route_id: f.route_id || null,
      driver_id: f.driver_id || null,
      truck_id: f.truck_id || null,
      dispatcher_id: f.dispatcher_id || null,
      status: f.status,
      notes: f.notes || null,
    };
    try {
      const { data, error } = initialLoad
        ? await supabase
            .from("loads")
            .update(payload)
            .eq("id", initialLoad.id)
            .eq("company_id", companyId)
            .select("id")
        : await supabase
            .from("loads")
            .insert({ ...payload, company_id: companyId })
            .select("id");
      setSaving(false);
      if (error || !data?.length) {
        toast.error(error?.message ?? "Load was not saved");
        return;
      }
      toast.success(initialLoad ? "Load updated" : "Load created");
      invalidate("loads");
      invalidate("drivers");
      setF(loadInitial());
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Load was not saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) {
          setOpen(value);
          if (value) setF(loadInitial());
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={initialLoad ? "outline" : "default"} size={initialLoad ? "sm" : "default"}>
          {initialLoad ? "Edit load" : "+ Build Load"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialLoad ? "Edit Load" : "Load Builder"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <Section n={1} title="Broker / Customer">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Broker">
                <Input value={f.broker} onChange={set("broker")} placeholder="TQL, CH Robinson…" />
              </Field>
              <Field label="MC #">
                <Input value={f.broker_mc} onChange={set("broker_mc")} />
              </Field>
              <Field label="Load / PO #">
                <Input value={f.reference_no} onChange={set("reference_no")} />
              </Field>
            </div>
          </Section>
          <Section n={2} title="Pickup & Delivery">
            <Field label="Saved lane (optional)">
              <select
                className={selectCls}
                value={f.route_id}
                onChange={(e) => pickRoute(e.target.value)}
              >
                <option value="">— Select —</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.origin} → {r.destination})
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Shipper">
                <AddressAutocomplete business value={f.shipper} onChange={(value) => setF({ ...f, shipper: value })} placeholder="Search shipper or facility" />
              </Field>
              <Field label="Pickup city, state">
                <AddressAutocomplete
                  required
                  value={f.origin}
                  onChange={(value) => setF({ ...f, origin: value })}
                  placeholder="Search pickup city or address"
                />
              </Field>
              <Field label="Pickup date">
                <Input type="date" value={f.pickup_date} onChange={set("pickup_date")} />
              </Field>
              <Field label="Consignee">
                <AddressAutocomplete business value={f.consignee} onChange={(value) => setF({ ...f, consignee: value })} placeholder="Search consignee or facility" />
              </Field>
              <Field label="Delivery city, state">
                <AddressAutocomplete
                  required
                  value={f.destination}
                  onChange={(value) => setF({ ...f, destination: value })}
                  placeholder="Search delivery city or address"
                />
              </Field>
              <Field label="Delivery date">
                <Input type="date" value={f.delivery_date} onChange={set("delivery_date")} />
              </Field>
            </div>
          </Section>
          <Section n={3} title="Freight & Equipment">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Commodity">
                <Input
                  value={f.commodity}
                  onChange={set("commodity")}
                  placeholder="Excavator, Steel coils…"
                />
              </Field>
              <Field label="Equipment">
                <select
                  className={selectCls}
                  value={f.equipment_type}
                  onChange={(e) => setF({ ...f, equipment_type: e.target.value, truck_id: "" })}
                >
                  {equipmentTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pieces">
                <Input type="number" value={f.pieces} onChange={set("pieces")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Weight (lbs)">
                <Input type="number" value={f.weight_lbs} onChange={set("weight_lbs")} />
              </Field>
              <Field label="Length (ft)">
                <Input type="number" step="0.1" value={f.length_ft} onChange={set("length_ft")} />
              </Field>
              <Field label="Width (ft)">
                <Input type="number" step="0.1" value={f.width_ft} onChange={set("width_ft")} />
              </Field>
              <Field label="Height (ft)">
                <Input type="number" step="0.1" value={f.height_ft} onChange={set("height_ft")} />
              </Field>
            </div>
            {oversize && (
              <div className="rounded-md border border-[var(--st-transit)]/40 bg-[var(--st-transit)]/10 p-2 text-xs text-foreground">
                ⚠ Permit review flagged by screening dimensions. Confirm loaded height, gross/axle
                weights, equipment capacity and route-specific requirements with your permit
                provider before dispatch. This is not a permit determination.
                <Input
                  className="mt-2"
                  value={f.permits}
                  onChange={set("permits")}
                  placeholder="Permit states: TX, LA, MS…"
                />
              </div>
            )}
          </Section>
          <Section n={4} title="Rate">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Miles">
                <Input type="number" value={f.miles} onChange={set("miles")} />
              </Field>
              <Field label="Linehaul ($)">
                <Input type="number" value={f.rate} onChange={set("rate")} />
              </Field>
              <Field label="Detention ($)">
                <Input type="number" value={f.detention} onChange={set("detention")} />
              </Field>
              <Field label="Lumper ($)">
                <Input type="number" value={f.lumper} onChange={set("lumper")} />
              </Field>
            </div>
            <div className="flex gap-6 font-mono text-xs text-muted-foreground">
              <span>
                Total: <b className="text-foreground">{usd(total)}</b>
              </span>
              <span>
                RPM: <b className="text-foreground">{rpm ? `$${rpm.toFixed(2)}/mi` : "—"}</b>
              </span>
            </div>
          </Section>
          <Section n={5} title="Dispatch">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label={`Truck (${f.equipment_type})`}>
                <select
                  className={selectCls}
                  value={f.truck_id}
                  onChange={(e) => pickTruck(e.target.value)}
                >
                  <option value="">—</option>
                  {fitTrucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.unit_no} · {t.axles}ax
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Driver">
                <select className={selectCls} value={f.driver_id} onChange={set("driver_id")}>
                  <option value="">Unassigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                      {d.current_city ? ` · ${d.current_city}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dispatcher">
                <select
                  className={selectCls}
                  value={f.dispatcher_id}
                  onChange={set("dispatcher_id")}
                >
                  <option value="">—</option>
                  {dispatchers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select className={selectCls} value={f.status} onChange={set("status")}>
                  {loadStatusOrder.map((k) => (
                    <option key={k} value={k}>
                      {loadStatusLabel[k]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Notes">
              <Input value={f.notes} onChange={set("notes")} />
            </Field>
          </Section>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : initialLoad ? "Save changes" : "Create Load"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
