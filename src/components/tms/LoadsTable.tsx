import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useList, useInvalidate, shortName, loadStatusLabel, useCurrentUser, type LoadStatus } from "@/lib/tms";
import { TableShell, Th, Td, LoadStatusPill, Empty, DocDots } from "./ui";
import { cn } from "@/lib/utils";

const filters: { key: "all" | LoadStatus; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "yolda", label: "Yolda" },
  { key: "teslim_edildi", label: "Teslim" },
];

export function LoadFilters({ value, onChange, total }: { value: string; onChange: (v: "all" | LoadStatus) => void; total: number }) {
  return (
    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
      {filters.map((f) => (
        <button key={f.key} onClick={() => onChange(f.key)} className={cn("rounded px-2 py-0.5", value === f.key && "bg-foreground/5 text-foreground")}>
          {f.label}{f.key === "all" ? ` ${total}` : ""}
        </button>
      ))}
    </div>
  );
}

export function useLoadsData() {
  const loads = useList("loads", "load_no", false);
  const drivers = useList("drivers").data ?? [];
  const dispatchers = useList("dispatchers").data ?? [];
  const docs = useList("documents").data ?? [];
  return { loads: loads.data ?? [], isLoading: loads.isLoading, drivers, dispatchers, docs };
}

function UploadBtn({ loadId, type, done }: { loadId: string; type: "BOL" | "POD"; done: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidate();
  const { user } = useCurrentUser();
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    const path = `${loadId}/${type}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) { setBusy(false); return toast.error(error.message); }
    await supabase.from("documents").insert({ load_id: loadId, doc_type: type, file_path: path, file_name: file.name, uploaded_by: user?.id });
    setBusy(false);
    toast.success(`${type} yüklendi`);
    invalidate("documents");
  }

  return (
    <>
      <input ref={ref} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px]", done ? "border-primary/30 bg-primary/10 text-primary" : "border-dashed text-muted-foreground hover:border-primary hover:text-primary")}
      >
        {busy ? "…" : done ? `${type} ✓` : `+ ${type}`}
      </button>
    </>
  );
}

export function LoadsTable({ filter = "all", editable = false, limit }: { filter?: string; editable?: boolean; limit?: number }) {
  const { loads, isLoading, drivers, dispatchers, docs } = useLoadsData();
  const invalidate = useInvalidate();
  let rows = filter === "all" ? loads : loads.filter((l) => l.status === filter);
  if (limit) rows = rows.slice(0, limit);
  const dName = (id: string | null) => drivers.find((d) => d.id === id)?.full_name;
  const pName = (id: string | null) => dispatchers.find((d) => d.id === id)?.full_name;
  const has = (id: string, t: string) => docs.some((d) => d.load_id === id && d.doc_type === t);

  async function setStatus(id: string, status: LoadStatus) {
    const { error } = await supabase.from("loads").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate("loads");
  }

  if (isLoading) return <Empty text="Yükleniyor…" />;
  if (!rows.length) return <Empty text="Görev bulunamadı." />;

  return (
    <TableShell
      head={<><Th>Görev</Th><Th className="px-2">Rota</Th><Th className="px-2">Durum</Th><Th className="px-2">Sürücü</Th><Th className="px-2">Dispatcher</Th><Th className="text-right">BOL/POD</Th></>}
    >
      {rows.map((l) => (
        <tr key={l.id}>
          <Td className="font-mono font-medium">#{4820 + l.load_no}</Td>
          <Td className="px-2">{l.origin} → {l.destination}{l.distance_km != null && <span className="block text-[11px] text-muted-foreground">{l.distance_km} km</span>}</Td>
          <Td className="px-2">
            {editable ? (
              <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value as LoadStatus)} className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium outline-none">
                {Object.entries(loadStatusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            ) : <LoadStatusPill status={l.status} />}
          </Td>
          <Td className={cn("px-2", !l.driver_id && "text-muted-foreground")}>{l.driver_id ? shortName(dName(l.driver_id)) : "Atanmadı"}</Td>
          <Td className="px-2">{shortName(pName(l.dispatcher_id))}</Td>
          <Td className="text-right">
            {editable ? (
              <span className="inline-flex gap-1.5"><UploadBtn loadId={l.id} type="BOL" done={has(l.id, "BOL")} /><UploadBtn loadId={l.id} type="POD" done={has(l.id, "POD")} /></span>
            ) : <DocDots bol={has(l.id, "BOL")} pod={has(l.id, "POD")} />}
          </Td>
        </tr>
      ))}
    </TableShell>
  );
}
