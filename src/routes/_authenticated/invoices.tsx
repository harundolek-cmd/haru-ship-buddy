import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResourceManager, type Row, QueryNotice } from "@/components/tms/business/ResourceManager";
import { useRecords, today, invoiceState, loadRevenue, errorText } from "@/lib/business";
import { businessDb } from "@/lib/business-db";
import { useList, loadNo, useCurrentUser } from "@/lib/tms";
import { usd } from "@/lib/equipment";
import { Kpi, Field, Panel, TableShell, Th, Td, Empty, selectCls } from "@/components/tms/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export const Route = createFileRoute("/_authenticated/invoices")({ component: Invoices });
function Invoices() {
  const q = useRecords("invoices"),
    payments = useRecords("invoice_payments"),
    loads = useList("loads").data ?? [],
    qc = useQueryClient(),
    { companyId, isAdmin } = useCurrentUser();
  const [invoice, setInvoice] = useState<Row | null>(null),
    [amount, setAmount] = useState(""),
    [date, setDate] = useState(today()),
    [reference, setReference] = useState(""),
    [method, setMethod] = useState("ACH"),
    [request, setRequest] = useState(""),
    [busy, setBusy] = useState(false),
    [load, setLoad] = useState("");
  const rows = q.data ?? [],
    open = rows.filter((i) => i.status === "issued" && i.paid_amount < i.total);
  async function createFromLoad() {
    const l = loads.find((l) => l.id === load);
    if (!l || !companyId) return;
    setBusy(true);
    try {
      const due = new Date();
      due.setDate(due.getDate() + 30);
      const dueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
      const { error } = await businessDb
        .from("invoices")
        .insert({
          company_id: companyId,
          load_id: l.id,
          invoice_no: `INV-${loadNo(l.load_no)}`,
          customer_name: l.broker || l.shipper || "Customer",
          issue_date: today(),
          due_date: dueDate,
          total: loadRevenue(l),
          status: "draft",
          notes:
            "Linehaul, detention and lumper charges. Review customer and due date before issuing.",
        });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["business", "invoices"] });
      toast.success("Draft invoice created");
      setLoad("");
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice || busy) return;
    const n = Number(amount);
    if (
      !Number.isFinite(n) ||
      n <= 0 ||
      n > Number(invoice["total"]) - Number(invoice["paid_amount"])
    ) {
      toast.error("Enter a payment within the outstanding balance");
      return;
    }
    setBusy(true);
    try {
      const { error } = await businessDb.rpc("record_invoice_payment", {
        p_invoice: invoice.id,
        p_amount: n,
        p_date: date,
        p_reference: reference,
        p_method: method,
        p_request: request,
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["business"] });
      toast.success("Payment recorded");
      setInvoice(null);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ResourceManager
        table="invoices"
        adminOnly
        title="Invoices & Receivables"
        subtitle="Create draft invoices, issue them, record partial payments and monitor overdue balances. All amounts are USD."
        columns={["invoice_no", "customer_name", "due_date", "total", "status"]}
        fields={[
          { key: "invoice_no", label: "Invoice number", required: true },
          { key: "customer_name", label: "Bill to", required: true },
          {
            key: "load_id",
            label: "Load",
            options: loads.map((l) => ({ value: l.id, label: loadNo(l.load_no) })),
          },
          {
            key: "issue_date",
            label: "Issue date",
            type: "date",
            required: true,
            default: today(),
          },
          { key: "due_date", label: "Due date", type: "date", required: true },
          {
            key: "total",
            label: "Total ($)",
            type: "number",
            min: 0.01,
            required: true,
            money: true,
          },
          {
            key: "status",
            label: "Status",
            required: true,
            default: "draft",
            options: [
              { value: "draft", label: "Draft" },
              { value: "issued", label: "Issued" },
              { value: "void", label: "Void" },
            ],
          },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        validate={(r) =>
          String(r["due_date"]) < String(r["issue_date"])
            ? "Due date must be on or after issue date"
            : undefined
        }
        actions={(r) => (
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs">
              {invoiceState({
                status: String(r["status"]),
                total: Number(r["total"]),
                paid_amount: Number(r["paid_amount"]),
                due_date: String(r["due_date"]),
              })}{" "}
              · {usd(Number(r["total"]) - Number(r["paid_amount"]))} due
            </span>
            {r["status"] === "issued" && Number(r["total"]) > Number(r["paid_amount"]) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setInvoice(r);
                  setAmount("");
                  setReference("");
                  setDate(today());
                  setRequest(crypto.randomUUID());
                }}
              >
                Payment
              </Button>
            )}
          </div>
        )}
      >
        {isAdmin && !q.error && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Kpi
                label="Outstanding"
                value={usd(open.reduce((s, i) => s + i.total - i.paid_amount, 0))}
              />
              <Kpi
                label="Overdue"
                color="--st-cancelled"
                value={usd(
                  open
                    .filter((i) => invoiceState(i) === "overdue")
                    .reduce((s, i) => s + i.total - i.paid_amount, 0),
                )}
              />
              <Kpi
                label="Collected"
                color="--st-delivered"
                value={usd(
                  rows.filter((i) => i.status !== "void").reduce((s, i) => s + i.paid_amount, 0),
                )}
              />
            </div>
            <Panel title="Invoice team queue">
              <div className="grid gap-4 p-4 sm:grid-cols-4">
                <Kpi label="To issue" value={rows.filter((i) => i.status === "draft").length} hint="Drafts awaiting review" />
                <Kpi label="Overdue follow-up" value={open.filter((i) => invoiceState(i) === "overdue").length} hint="Customer contact needed" color="--st-cancelled" />
                <Kpi label="Partial payments" value={rows.filter((i) => invoiceState(i) === "partial").length} hint="Balance still open" color="--st-transit" />
                <Kpi label="Paid invoices" value={rows.filter((i) => invoiceState(i) === "paid").length} hint="Closed this cycle" color="--st-delivered" />
              </div>
            </Panel>
            <Panel title="Invoice a delivered load">
              <div className="flex flex-wrap gap-3 p-4">
                <select
                  aria-label="Delivered load"
                  className={selectCls + " max-w-lg"}
                  value={load}
                  onChange={(e) => setLoad(e.target.value)}
                >
                  <option value="">Select a delivered, uninvoiced load…</option>
                  {loads
                    .filter(
                      (l) =>
                        ["teslim_edildi", "invoiced"].includes(l.status) &&
                        !rows.some((i) => i.load_id === l.id && i.status !== "void"),
                    )
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {loadNo(l.load_no)} · {l.broker} · {usd(loadRevenue(l))}
                      </option>
                    ))}
                </select>
                <Button disabled={!load || busy} onClick={createFromLoad}>
                  Create draft
                </Button>
              </div>
            </Panel>
          </>
        )}
      </ResourceManager>
      {isAdmin && (
        <Panel title="Payment history">
          {payments.error ? (
            <QueryNotice error={payments.error} />
          ) : !payments.data?.length ? (
            <Empty text="No payments recorded." />
          ) : (
            <TableShell
              head={
                <>
                  <Th>Invoice</Th>
                  <Th>Date</Th>
                  <Th>Method</Th>
                  <Th>Reference</Th>
                  <Th>Amount</Th>
                </>
              }
            >
              {payments.data.map((p) => (
                <tr key={p.id}>
                  <Td>{rows.find((i) => i.id === p.invoice_id)?.invoice_no ?? "—"}</Td>
                  <Td>{p.paid_on}</Td>
                  <Td>{p.method}</Td>
                  <Td>{p.reference}</Td>
                  <Td>{usd(p.amount)}</Td>
                </tr>
              ))}
            </TableShell>
          )}
        </Panel>
      )}
      <Dialog
        open={!!invoice}
        onOpenChange={(o) => {
          if (!o && !busy) setInvoice(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment · {String(invoice?.["invoice_no"] ?? "")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Balance: {usd(Number(invoice?.["total"]) - Number(invoice?.["paid_amount"]))}
          </p>
          <form className="grid gap-3" onSubmit={pay}>
            <Field label="Amount ($)">
              <Input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Paid on">
              <Input
                required
                type="date"
                max={today()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Method">
              <select
                className={selectCls}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {["ACH", "Wire", "Check", "Cash", "Factoring", "Other"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Reference">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
            <Button disabled={busy}>{busy ? "Recording…" : "Record payment"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
