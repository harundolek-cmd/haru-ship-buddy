import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useList, useCurrentUser, loadNo, driverPayFor } from "@/lib/tms";
import { useRecords, errorText, today, exportCsv, cents } from "@/lib/business";
import { businessDb } from "@/lib/business-db";
import {
  PageHeader,
  Panel,
  Field,
  Kpi,
  Empty,
  TableShell,
  Th,
  Td,
  selectCls,
} from "@/components/tms/ui";
import { QueryNotice } from "@/components/tms/business/ResourceManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usd } from "@/lib/equipment";
export const Route = createFileRoute("/_authenticated/driver-pay")({ component: DriverPay });
function DriverPay() {
  const { isAdmin } = useCurrentUser(),
    drivers = useList("drivers").data ?? [],
    loads = useList("loads").data ?? [],
    settlements = useList("settlements"),
    links = useRecords("settlement_loads"),
    qc = useQueryClient();
  const [driver, setDriver] = useState(""),
    [start, setStart] = useState(today().slice(0, 7) + "-01"),
    [end, setEnd] = useState(today()),
    [deductions, setDeductions] = useState("0"),
    [notes, setNotes] = useState(""),
    [busy, setBusy] = useState(false);
  const d = drivers.find((d) => d.id === driver);
  const selected = loads.filter(
    (l) =>
      l.driver_id === driver &&
      ["teslim_edildi", "invoiced"].includes(l.status) &&
      l.delivery_date &&
      l.delivery_date >= start &&
      l.delivery_date <= end &&
      !links.data?.some((x) => x.load_id === l.id) &&
      !settlements.data?.some(
        (s) =>
          s.driver_id === driver &&
          s.period_start &&
          s.period_end &&
          l.delivery_date! >= s.period_start &&
          l.delivery_date! <= s.period_end &&
          !links.data?.some((x) => x.settlement_id === s.id),
      ),
  );
  const pay = selected.reduce((s, l) => s + cents(d ? driverPayFor(d, l) : 0), 0);
  async function create() {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await businessDb.rpc("create_driver_settlement", {
        p_driver: driver,
        p_start: start,
        p_end: end,
        p_deductions: Number(deductions),
        p_notes: notes,
      });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success("Settlement recorded");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  if (!isAdmin)
    return (
      <>
        <PageHeader title="Driver Pay" />
        <Empty text="Company administrator access required." />
      </>
    );
  return (
    <>
      <PageHeader
        title="Driver Settlements"
        subtitle="Linehaul-based percentage, per-mile or flat-per-load pay. Saved settlements are immutable and cannot include the same load twice."
      />
      {links.error ? (
        <QueryNotice error={links.error} />
      ) : (
        <Panel title="Prepare settlement">
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            <Field label="Driver">
              <select
                className={selectCls}
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
              >
                <option value="">Select driver…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Delivery date from">
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Through">
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
            <Field label="Deductions ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                max={pay}
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
              />
            </Field>
            <Field label="Notes">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            <Kpi label="Eligible loads" value={selected.length} />
            <Kpi label="Driver pay" value={usd(pay)} />
            <Kpi
              label="Net settlement"
              value={usd(pay - Number(deductions))}
              color="--st-delivered"
            />
          </div>
          <div className="p-4">
            <p className="mb-3 text-xs text-muted-foreground">
              {selected.map((l) => loadNo(l.load_no)).join(", ") ||
                "No eligible loads. Check delivery dates and driver assignment."}
            </p>
            <Button
              disabled={
                busy ||
                links.isLoading ||
                !selected.length ||
                !start ||
                !end ||
                start > end ||
                !Number.isFinite(Number(deductions)) ||
                Number(deductions) < 0 ||
                Number(deductions) > pay
              }
              onClick={create}
            >
              {busy ? "Saving…" : "Record settlement"}
            </Button>
          </div>
        </Panel>
      )}
      <Panel
        title="Settlement history"
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              exportCsv(
                "settlements.csv",
                ["Driver", "Start", "End", "Gross", "Pay", "Deductions", "Net"],
                (settlements.data ?? []).map((s) => [
                  drivers.find((d) => d.id === s.driver_id)?.full_name,
                  s.period_start,
                  s.period_end,
                  s.gross,
                  s.driver_pay,
                  s.deductions,
                  s.net,
                ]),
              )
            }
          >
            Export CSV
          </Button>
        }
      >
        {settlements.error ? (
          <QueryNotice error={settlements.error} />
        ) : (
          <TableShell
            head={
              <>
                <Th>Driver</Th>
                <Th>Period</Th>
                <Th>Linehaul</Th>
                <Th>Pay</Th>
                <Th>Deductions</Th>
                <Th>Net</Th>
              </>
            }
          >
            {settlements.data?.map((s) => (
              <tr key={s.id}>
                <Td>{drivers.find((d) => d.id === s.driver_id)?.full_name}</Td>
                <Td>
                  {s.period_start} – {s.period_end}
                </Td>
                <Td>{usd(s.gross)}</Td>
                <Td>{usd(s.driver_pay)}</Td>
                <Td>{usd(s.deductions)}</Td>
                <Td>{usd(s.net)}</Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
