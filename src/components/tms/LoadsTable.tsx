import { NewLoadButton } from "./LoadDialog";
import { useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useList,
  useInvalidate,
  shortName,
  loadStatusLabel,
  loadStatusOrder,
  loadStatusVar,
  useCurrentUser,
  loadNo,
  loadMiles,
  fmtDate,
  type LoadStatus,
} from "@/lib/tms";
import { usd } from "@/lib/equipment";
import { TableShell, Th, Td, LoadStatusPill, Empty, DocDots } from "./ui";
import { cn } from "@/lib/utils";

export function LoadFilters({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (v: "all" | LoadStatus) => void;
  counts: Record<string, number>;
}) {
  const items: ("all" | LoadStatus)[] = ["all", ...loadStatusOrder];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((k) => {
        const active = value === k;
        const style =
          k === "all" ? undefined : ({ "--c": `var(${loadStatusVar[k]})` } as CSSProperties);
        return (
          <button
            key={k}
            onClick={() => onChange(k)}
            style={style}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
              active
                ? k === "all"
                  ? "border-foreground bg-foreground text-background"
                  : "status-badge border-transparent"
                : "bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {k !== "all" && (
              <span
                className="size-2 rounded-full"
                style={{ background: `var(${loadStatusVar[k]})` }}
              />
            )}
            {k === "all" ? "All" : loadStatusLabel[k]}
            <span className="font-mono text-[10px] opacity-70">{counts[k] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

export function useLoadsData() {
  const loads = useList("loads", "load_no", false);
  const drivers = useList("drivers").data ?? [];
  const dispatchers = useList("dispatchers").data ?? [];
  const trucks = useList("trucks").data ?? [];
  const docs = useList("documents").data ?? [];
  const permits = useList("permits").data ?? [];
  return {
    loads: loads.data ?? [],
    isLoading: loads.isLoading,
    drivers,
    dispatchers,
    trucks,
    docs,
    permits,
  };
}

function UploadBtn({ loadId, type, done }: { loadId: string; type: "BOL" | "POD"; done: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const invalidate = useInvalidate();
  const { user, companyId } = useCurrentUser();
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!companyId) return;
    setBusy(true);
    const path = `${companyId}/${loadId}/${type}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    await supabase
      .from("documents")
      .insert({
        load_id: loadId,
        doc_type: type,
        file_path: path,
        file_name: file.name,
        uploaded_by: user?.id ?? null,
      });
    setBusy(false);
    toast.success(`${type} uploaded`);
    invalidate("documents");
  }

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={cn(
          "rounded border px-1.5 py-0.5 font-mono text-[10px]",
          done
            ? "status-badge border-transparent"
            : "border-dashed text-muted-foreground hover:border-primary hover:text-primary",
        )}
        style={done ? ({ "--c": "var(--st-delivered)" } as CSSProperties) : undefined}
      >
        {busy ? "…" : done ? `${type} ✓` : `+ ${type}`}
      </button>
    </>
  );
}

export function LoadsTable({
  filter = "all",
  editable = false,
  limit,
  search = "",
}: {
  filter?: string;
  editable?: boolean;
  limit?: number;
  search?: string;
}) {
  const { loads, isLoading, drivers, dispatchers, trucks, docs, permits } = useLoadsData();
  const invalidate = useInvalidate();
  let rows = filter === "all" ? loads : loads.filter((l) => l.status === filter);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((l) =>
      [loadNo(l.load_no), l.origin, l.destination, l.broker, l.reference_no, l.commodity].some(
        (x) => x?.toLowerCase().includes(q),
      ),
    );
  }
  if (limit) rows = rows.slice(0, limit);
  const dName = (id: string | null) => drivers.find((d) => d.id === id)?.full_name;
  const pName = (id: string | null) => dispatchers.find((d) => d.id === id)?.full_name;
  const tUnit = (id: string | null) => trucks.find((t) => t.id === id)?.unit_no;
  const has = (id: string, t: string) => docs.some((d) => d.load_id === id && d.doc_type === t);

  async function setStatus(id: string, status: LoadStatus) {
    const { error } = await supabase.from("loads").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate("loads");
  }

  if (isLoading) return <Empty text="Loading…" />;
  if (!rows.length) return <Empty text="No loads found." />;

  return (
    <TableShell
      head={
        <>
          <Th>Load #</Th>
          <Th>Status</Th>
          <Th>Pickup → Delivery</Th>
          <Th>Broker</Th>
          <Th>Equip.</Th>
          <Th className="text-right">Rate</Th>
          <Th>Driver / Truck</Th>
          <Th>Dispatcher</Th>
          <Th className="text-right">Docs</Th>
        </>
      }
    >
      {rows.map((l) => {
        const mi = loadMiles(l);
        const needsPermit = l.oversize && !permits.some((p) => p.load_id === l.id);
        return (
          <tr
            key={l.id}
            className="row-accent hover:bg-muted/40"
            style={{ "--c": `var(${loadStatusVar[l.status]})` } as CSSProperties}
          >
            <Td className="font-mono font-semibold">
              {loadNo(l.load_no)}
              {editable && (
                <div className="mt-2">
                  <NewLoadButton initialLoad={l} />
                </div>
              )}
              {l.reference_no && (
                <span className="block text-[10px] font-normal text-muted-foreground">
                  PO {l.reference_no}
                </span>
              )}
            </Td>
            <Td>
              {editable ? (
                <select
                  value={l.status}
                  onChange={(e) => setStatus(l.id, e.target.value as LoadStatus)}
                  style={{ "--c": `var(${loadStatusVar[l.status]})` } as CSSProperties}
                  className="status-badge rounded px-1.5 py-0.5 text-[11px] font-semibold outline-none"
                >
                  {loadStatusOrder.map((k) => (
                    <option key={k} value={k}>
                      {loadStatusLabel[k]}
                    </option>
                  ))}
                </select>
              ) : (
                <LoadStatusPill status={l.status} />
              )}
            </Td>
            <Td>
              <div className="font-medium">
                {l.origin} → {l.destination}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {fmtDate(l.pickup_date)} – {fmtDate(l.delivery_date)}
                {mi ? ` · ${mi.toLocaleString()} mi` : ""}
              </div>
            </Td>
            <Td>
              {l.broker ?? "—"}
              {l.broker_mc && (
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {l.broker_mc}
                </span>
              )}
            </Td>
            <Td>
              {l.equipment_type ?? "—"}
              {l.oversize && (
                <span
                  className={cn(
                    "ml-1 rounded px-1 text-[9px] font-bold",
                    needsPermit
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                  title={needsPermit ? "Permits required" : "Permits on file"}
                >
                  OS/OW{needsPermit ? " !" : ""}
                </span>
              )}
            </Td>
            <Td className="text-right font-mono">
              {usd(l.rate)}
              {l.rate && mi ? (
                <span className="block text-[10px] text-muted-foreground">
                  ${(Number(l.rate) / mi).toFixed(2)}/mi
                </span>
              ) : null}
            </Td>
            <Td className={cn(!l.driver_id && "text-muted-foreground")}>
              {l.driver_id ? shortName(dName(l.driver_id)) : "Unassigned"}
              {l.truck_id && (
                <span className="block font-mono text-[10px] text-muted-foreground">
                  {tUnit(l.truck_id)}
                </span>
              )}
            </Td>
            <Td>{shortName(pName(l.dispatcher_id))}</Td>
            <Td className="text-right">
              {editable ? (
                <div className="inline-flex flex-col items-end gap-1">
                  <span className="inline-flex gap-1">
                    <UploadBtn loadId={l.id} type="BOL" done={has(l.id, "BOL")} />
                    <UploadBtn loadId={l.id} type="POD" done={has(l.id, "POD")} />
                  </span>
                  <span className="inline-flex gap-1.5 text-[10px]">
                    {(["bol", "ratecon", "invoice"] as const).map((d) => (
                      <Link
                        key={d}
                        to="/print/$doc/$loadId"
                        params={{ doc: d, loadId: l.id }}
                        className="text-primary hover:underline"
                      >
                        {d === "bol" ? "BOL" : d === "ratecon" ? "RC" : "INV"}
                      </Link>
                    ))}
                  </span>
                </div>
              ) : (
                <DocDots bol={has(l.id, "BOL")} pod={has(l.id, "POD")} />
              )}
            </Td>
          </tr>
        );
      })}
    </TableShell>
  );
}
