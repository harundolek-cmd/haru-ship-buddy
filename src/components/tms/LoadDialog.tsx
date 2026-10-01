import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useList, useInvalidate, loadStatusLabel, type LoadStatus } from "@/lib/tms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, selectCls } from "./ui";

export function NewLoadButton() {
  const [open, setOpen] = useState(false);
  const routes = useList("routes", "name", true).data ?? [];
  const drivers = useList("drivers", "full_name", true).data ?? [];
  const dispatchers = useList("dispatchers", "full_name", true).data ?? [];
  const invalidate = useInvalidate();
  const empty = { origin: "", destination: "", distance_km: "", route_id: "", driver_id: "", dispatcher_id: "", pickup_date: "", rate: "", status: "rezerve" as LoadStatus, notes: "" };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function pickRoute(id: string) {
    const r = routes.find((x) => x.id === id);
    setF({ ...f, route_id: id, origin: r?.origin ?? f.origin, destination: r?.destination ?? f.destination, distance_km: r?.distance_km?.toString() ?? f.distance_km });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("loads").insert({
      origin: f.origin,
      destination: f.destination,
      distance_km: f.distance_km ? Number(f.distance_km) : null,
      route_id: f.route_id || null,
      driver_id: f.driver_id || null,
      dispatcher_id: f.dispatcher_id || null,
      pickup_date: f.pickup_date || null,
      rate: f.rate ? Number(f.rate) : null,
      status: f.status,
      notes: f.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    if (f.driver_id) await supabase.from("drivers").update({ status: "gorevde" }).eq("id", f.driver_id);
    toast.success("Görev oluşturuldu");
    invalidate("loads");
    invalidate("drivers");
    setF(empty);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 pl-2 pr-3"><span className="font-mono">＋</span> Yeni Görev</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni Görev</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <Field label="Kayıtlı rota (opsiyonel)">
            <select className={selectCls} value={f.route_id} onChange={(e) => pickRoute(e.target.value)}>
              <option value="">— Seçin —</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.origin} → {r.destination})</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Çıkış"><Input required value={f.origin} onChange={set("origin")} /></Field>
            <Field label="Varış"><Input required value={f.destination} onChange={set("destination")} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mesafe (km)"><Input type="number" value={f.distance_km} onChange={set("distance_km")} /></Field>
            <Field label="Yükleme tarihi"><Input type="date" value={f.pickup_date} onChange={set("pickup_date")} /></Field>
            <Field label="Ücret (₺)"><Input type="number" value={f.rate} onChange={set("rate")} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sürücü">
              <select className={selectCls} value={f.driver_id} onChange={set("driver_id")}>
                <option value="">Atanmadı</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </Field>
            <Field label="Dispatcher">
              <select className={selectCls} value={f.dispatcher_id} onChange={set("dispatcher_id")}>
                <option value="">—</option>
                {dispatchers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </Field>
            <Field label="Durum">
              <select className={selectCls} value={f.status} onChange={set("status")}>
                {Object.entries(loadStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Not"><Input value={f.notes} onChange={set("notes")} /></Field>
          <Button type="submit" className="mt-1">Görevi oluştur</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
