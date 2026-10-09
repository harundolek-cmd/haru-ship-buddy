import { createFileRoute } from "@tanstack/react-router";
import { useList, useCurrentUser, loadNo, fmtDate } from "@/lib/tms";
import { useRecords, loadRevenue } from "@/lib/business";
import { usd } from "@/lib/equipment";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/tms/ui";
export const Route = createFileRoute("/_authenticated/print/$doc/$loadId")({
  component: PrintDocument,
});
function PrintDocument() {
  const { doc, loadId } = Route.useParams(),
    q = useList("loads"),
    { company, isAdmin } = useCurrentUser(),
    stops = useRecords("load_stops"),
    invoices = useRecords("invoices");
  const l = q.data?.find((l) => l.id === loadId);
  if (q.isLoading) return <Empty text="Loading shipment…" />;
  if (q.error || !l) return <Empty text="Shipment unavailable." />;
  if (!["bol", "ratecon", "invoice"].includes(doc))
    return <Empty text="Unsupported document type." />;
  const invoice = invoices.data?.find((i) => i.load_id === l.id && i.status !== "void");
  const title =
    doc === "bol"
      ? "Bill of Lading"
      : doc === "ratecon"
        ? "Rate Confirmation"
        : invoice
          ? "Freight Invoice"
          : "Freight Charge Summary";
  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Review the document, then print or save as PDF.
        </p>
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
      </div>
      <article className="print-sheet mx-auto max-w-4xl rounded-xl border bg-white p-5 text-slate-900 sm:p-10">
        <div className="flex flex-wrap justify-between gap-5 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">{company?.name ?? "HARU TMS"}</h1>
            <p className="mt-2 whitespace-pre-wrap text-sm">{company?.address}</p>
            <p className="text-sm">
              {company?.phone} · {company?.email}
            </p>
            <p className="text-sm">
              {company?.mc_number} · DOT {company?.dot_number}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="font-mono">
              {doc === "invoice" && invoice ? invoice.invoice_no : loadNo(l.load_no)}
            </p>
            <p>Reference: {l.reference_no ?? "—"}</p>
            {doc === "invoice" && invoice && (
              <p>
                {invoice.status.toUpperCase()} · Due {invoice.due_date}
              </p>
            )}
          </div>
        </div>
        <div className="my-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h3 className="font-semibold">Pickup / Shipper</h3>
            <p>{l.shipper ?? "—"}</p>
            <p>{l.origin}</p>
            <p>{fmtDate(l.pickup_date)}</p>
          </section>
          <section>
            <h3 className="font-semibold">Delivery / Consignee</h3>
            <p>{l.consignee ?? "—"}</p>
            <p>{l.destination}</p>
            <p>{fmtDate(l.delivery_date)}</p>
          </section>
        </div>
        <p className="mb-5">
          Customer / Broker: <b>{l.broker ?? "—"}</b> · MC {l.broker_mc ?? "—"}
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Commodity</th>
              <th>Pieces</th>
              <th>Weight (lb)</th>
              <th>Equipment</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3">{l.commodity ?? "—"}</td>
              <td className="text-center">{l.pieces ?? "—"}</td>
              <td className="text-center">{l.weight_lbs?.toLocaleString() ?? "—"}</td>
              <td className="text-center">{l.equipment_type ?? "—"}</td>
            </tr>
          </tbody>
        </table>
        {(stops.data ?? []).some((s) => s.load_id === l.id) && (
          <section className="mt-6">
            <h3 className="font-semibold">Additional stop instructions</h3>
            {stops.data
              ?.filter((s) => s.load_id === l.id)
              .sort((a, b) => a.sequence - b.sequence)
              .map((s) => (
                <p className="mt-2 text-sm" key={s.id}>
                  {s.sequence}. {s.kind} · {s.facility} · {s.address} ·{" "}
                  {s.appointment_at
                    ? new Date(s.appointment_at).toLocaleString()
                    : "Appointment pending"}{" "}
                  · {s.reference}
                </p>
              ))}
          </section>
        )}
        {doc !== "bol" && (
          <section className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
            {doc === "invoice" && invoice && isAdmin ? (
              <>
                <p>
                  Invoice total <b className="float-right">{usd(invoice.total)}</b>
                </p>
                <p>
                  Received <b className="float-right">{usd(invoice.paid_amount)}</b>
                </p>
                <p className="border-t pt-2">
                  Balance due{" "}
                  <b className="float-right">{usd(invoice.total - invoice.paid_amount)}</b>
                </p>
              </>
            ) : (
              <>
                <p>
                  Linehaul <b className="float-right">{usd(l.rate ?? 0)}</b>
                </p>
                <p>
                  Detention <b className="float-right">{usd(l.detention ?? 0)}</b>
                </p>
                <p>
                  Lumper <b className="float-right">{usd(l.lumper ?? 0)}</b>
                </p>
                <p className="border-t pt-2">
                  Total charges <b className="float-right">{usd(loadRevenue(l))}</b>
                </p>
                {doc === "invoice" && (
                  <p className="text-xs">
                    Charge summary only. This does not create or issue an invoice.
                  </p>
                )}
              </>
            )}
          </section>
        )}
        <section className="mt-8">
          <h3 className="font-semibold">Notes / Instructions</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">{l.notes || "—"}</p>
        </section>
        {doc === "bol" && (
          <div className="mt-16 grid grid-cols-2 gap-8 text-sm">
            <p className="border-t pt-2">Shipper signature / date</p>
            <p className="border-t pt-2">Receiver signature / date</p>
          </div>
        )}
        {doc === "ratecon" && (
          <p className="mt-10 border-t pt-3 text-sm">
            Authorized signature / date: ________________________
          </p>
        )}
      </article>
    </>
  );
}
