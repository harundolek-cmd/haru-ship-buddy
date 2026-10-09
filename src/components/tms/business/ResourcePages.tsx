import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResourceManager, options, type ResourceField, QueryNotice } from "./ResourceManager";
import { useList, loadNo, driverStatusLabel } from "@/lib/tms";
import { useRecords, today, errorText } from "@/lib/business";
import { businessDb } from "@/lib/business-db";
import { equipmentTypes, usStates, permitTypes } from "@/lib/equipment";
import { Kpi } from "@/components/tms/ui";
import { Button } from "@/components/ui/button";
const text = (key: string, label: string, required = false): ResourceField => ({
  key,
  label,
  required,
});
const number = (key: string, label: string, required = false): ResourceField => ({
  key,
  label,
  type: "number",
  min: 0,
  required,
});
const date = (key: string, label: string, required = false): ResourceField => ({
  key,
  label,
  type: "date",
  required,
});
const choice = (
  key: string,
  label: string,
  values: readonly string[],
  def?: string,
): ResourceField => ({
  key,
  label,
  options: options(values),
  default: def ?? values[0] ?? "",
  required: true,
});
const notes: ResourceField = { key: "notes", label: "Notes", type: "textarea" };
function useChoices() {
  const loads = useList("loads").data ?? [],
    drivers = useList("drivers").data ?? [],
    trucks = useList("trucks").data ?? [];
  return {
    load: {
      key: "load_id",
      label: "Load",
      options: loads.map((l) => ({
        value: l.id,
        label: `${loadNo(l.load_no)} · ${l.origin} → ${l.destination}`,
      })),
    } as ResourceField,
    driver: {
      key: "driver_id",
      label: "Driver",
      options: drivers.map((d) => ({ value: d.id, label: d.full_name })),
    } as ResourceField,
    truck: {
      key: "truck_id",
      label: "Truck / trailer",
      options: trucks.map((t) => ({ value: t.id, label: t.unit_no })),
    } as ResourceField,
  };
}
export function DriversPage() {
  const teams = useList("teams").data ?? [];
  return (
    <ResourceManager
      table="drivers"
      title="Drivers"
      subtitle="Contact details, availability, assignment and pay settings."
      columns={["full_name", "phone", "status", "current_city", "pay_type", "pay_rate"]}
      fields={[
        text("full_name", "Full name", true),
        { ...text("phone", "Phone"), type: "tel" },
        text("license_no", "License number"),
        choice("cdl_class", "CDL class", ["A", "B", "C"]),
        text("home_base", "Home base"),
        text("current_city", "Current city"),
        {
          key: "status",
          label: "Availability",
          required: true,
          default: "musait",
          options: Object.entries(driverStatusLabel).map(([value, label]) => ({ value, label })),
        },
        text("truck_plate", "Truck plate"),
        {
          key: "team_id",
          label: "Team",
          options: teams.map((t) => ({ value: t.id, label: t.name })),
        },
        choice("pay_type", "Pay basis", ["percent", "per_mile", "flat"]),
        { ...number("pay_rate", "Pay rate (% / $ per mile / $ per load)", true), default: "25" },
      ]}
      validate={(r) =>
        r["pay_type"] === "percent" && Number(r["pay_rate"]) > 100
          ? "Percentage cannot exceed 100"
          : undefined
      }
    />
  );
}
export function TrucksPage() {
  const c = useChoices();
  return (
    <ResourceManager
      table="trucks"
      title="Trucks & Trailers"
      subtitle="Equipment specifications, driver assignment and shop availability."
      columns={["unit_no", "equipment_type", "driver_id", "status", "axles", "max_weight_lbs"]}
      fields={[
        text("unit_no", "Unit number", true),
        choice("equipment_type", "Equipment", equipmentTypes),
        { ...number("axles", "Total combination axles"), step: "1", min: 2, max: 30 },
        text("make", "Make / model"),
        { ...number("model_year", "Model year"), step: "1", min: 1950, max: 2100 },
        text("vin", "VIN"),
        text("plate", "License plate"),
        { key: "plate_state", label: "Plate state", options: options(usStates) },
        number("deck_length_ft", "Deck length (ft)"),
        { ...number("max_weight_lbs", "Rated cargo capacity (lb)"), step: "1" },
        choice("status", "Status", ["active", "shop", "inactive"]),
        c.driver,
      ]}
    />
  );
}
export function PermitsPage() {
  const c = useChoices(),
    q = useList("permits");
  const rows = q.data ?? [];
  return (
    <ResourceManager
      table="permits"
      title="Permits & Escorts"
      subtitle="Track permit references, states, cost and expiry. Validate routing and operating conditions with your permit provider."
      columns={["load_id", "state", "permit_type", "permit_no", "status", "expiry_date", "cost"]}
      fields={[
        c.load,
        { key: "state", label: "State", required: true, options: options(usStates) },
        choice("permit_type", "Type", permitTypes),
        text("permit_no", "Permit number"),
        date("issue_date", "Issued"),
        date("expiry_date", "Expires"),
        { ...number("cost", "Cost ($)"), money: true },
        choice("status", "Status", ["pending", "active", "expired"]),
        notes,
      ]}
      validate={(r) =>
        r["issue_date"] && r["expiry_date"] && String(r["expiry_date"]) < String(r["issue_date"])
          ? "Expiry must be on or after issue date"
          : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Pending" value={rows.filter((r) => r["status"] === "pending").length} />
        <Kpi
          label="Expired by date"
          color="--st-cancelled"
          value={rows.filter((r) => r["expiry_date"] && r["expiry_date"] < today()).length}
        />
        <Kpi
          label="Active"
          color="--st-delivered"
          value={
            rows.filter(
              (r) => r["status"] === "active" && (!r["expiry_date"] || r["expiry_date"] >= today()),
            ).length
          }
        />
      </div>
    </ResourceManager>
  );
}
export function PartnersPage() {
  return (
    <ResourceManager
      table="partners"
      title="Customers & Partners"
      subtitle="One address book for brokers, shippers, carriers and vendors. Credit limits are internal records, not automated credit checks."
      columns={["name", "kind", "contact_name", "phone", "mc_number", "payment_terms", "status"]}
      fields={[
        text("name", "Company name", true),
        choice("kind", "Partner type", ["broker", "customer", "carrier", "vendor"]),
        text("contact_name", "Contact"),
        { ...text("email", "Email"), type: "email" },
        { ...text("phone", "Phone"), type: "tel" },
        text("mc_number", "MC #"),
        text("dot_number", "DOT #"),
        text("address", "Address"),
        {
          ...number("payment_terms", "Payment terms (days)", true),
          default: "30",
          step: "1",
          max: 365,
        },
        { ...number("credit_limit", "Internal credit limit ($)", true), default: "0", money: true },
        choice("status", "Status", ["active", "on_hold", "inactive"]),
        notes,
      ]}
    />
  );
}
export function QuotesPage() {
  const p = useRecords("partners"),
    qc = useQueryClient(),
    [busy, setBusy] = useState(false);
  return (
    <ResourceManager
      table="quotes"
      canEditRow={(r) => r["status"] !== "converted"}
      title="Quotes"
      subtitle="Record lane offers, track acceptance and convert an accepted quote into a booked load."
      columns={[
        "quote_no",
        "partner_id",
        "origin",
        "destination",
        "amount",
        "valid_until",
        "status",
      ]}
      defaultValues={{ quote_no: `Q-${crypto.randomUUID().slice(0, 8).toUpperCase()}` }}
      fields={[
        text("quote_no", "Quote number", true),
        {
          key: "partner_id",
          label: "Customer / broker",
          required: true,
          options: (p.data ?? [])
            .filter((p) => ["broker", "customer"].includes(p.kind))
            .map((p) => ({ value: p.id, label: p.name })),
        },
        text("origin", "Origin", true),
        text("destination", "Destination", true),
        choice("equipment_type", "Equipment", equipmentTypes),
        number("miles", "Loaded miles"),
        { ...number("amount", "Quoted linehaul ($)", true), money: true },
        date("valid_until", "Valid until"),
        choice("status", "Status", ["draft", "sent", "accepted", "declined"]),
        notes,
      ]}
      actions={(r) =>
        r["status"] === "accepted" ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const { error } = await businessDb.rpc("convert_quote", { p_quote: r["id"] });
                if (error) throw error;
                await qc.invalidateQueries();
                toast.success("Quote converted to a booked load");
              } catch (e) {
                toast.error(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Build load
          </Button>
        ) : r["status"] === "converted" ? (
          <span className="text-xs text-primary">Load created</span>
        ) : null
      }
    >
      {p.error && <QueryNotice error={p.error} />}
    </ResourceManager>
  );
}
export function ExpensesPage() {
  const c = useChoices();
  return (
    <ResourceManager
      table="expenses"
      adminOnly
      title="Expenses"
      subtitle="Record direct operating costs. Maintenance costs and permit costs are reported separately; do not enter them twice."
      columns={["expense_date", "category", "vendor", "amount", "load_id", "truck_id"]}
      fields={[
        date("expense_date", "Date", true),
        choice("category", "Category", [
          "fuel",
          "toll",
          "repair",
          "insurance",
          "parking",
          "escort",
          "other",
        ]),
        text("vendor", "Vendor"),
        { ...number("amount", "Amount ($)", true), money: true },
        c.load,
        c.truck,
        text("reference", "Receipt / reference"),
        notes,
      ]}
      defaultValues={{ expense_date: today() }}
    />
  );
}
export function MaintenancePage() {
  const c = useChoices(),
    q = useRecords("maintenance");
  return (
    <ResourceManager
      table="maintenance"
      title="Maintenance"
      subtitle="Plan PM services, inspections and repairs. Record completed work and cost without duplicating it in Expenses."
      columns={["truck_id", "service", "due_date", "status", "cost"]}
      fields={[
        { ...c.truck, required: true },
        text("service", "Service / repair", true),
        date("due_date", "Due date", true),
        { ...number("due_odometer", "Due odometer (mi)"), step: "1" },
        choice("status", "Status", ["scheduled", "in_progress", "completed", "cancelled"]),
        date("completed_date", "Completed date"),
        text("vendor", "Shop / vendor"),
        { ...number("cost", "Cost ($)", true), default: "0", money: true },
        notes,
      ]}
      validate={(r) =>
        r["status"] === "completed" && !r["completed_date"]
          ? "Enter the completion date"
          : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Kpi
          label="Overdue service"
          value={
            (q.data ?? []).filter(
              (r) => r["due_date"] < today() && !["completed", "cancelled"].includes(r["status"]),
            ).length
          }
          color="--st-cancelled"
        />
        <Kpi
          label="In progress"
          value={(q.data ?? []).filter((r) => r["status"] === "in_progress").length}
          color="--st-transit"
        />
      </div>
    </ResourceManager>
  );
}
export function TasksPage() {
  const c = useChoices();
  return (
    <ResourceManager
      table="operations_tasks"
      title="Tasks & Follow-ups"
      subtitle="Broker callbacks, appointment checks, missing documents and daily operations."
      columns={["title", "assignee", "due_date", "priority", "status", "load_id"]}
      fields={[
        text("title", "Task", true),
        c.load,
        text("assignee", "Assigned to"),
        date("due_date", "Due date"),
        choice("priority", "Priority", ["normal", "low", "high", "urgent"]),
        choice("status", "Status", ["open", "in_progress", "done", "cancelled"]),
        notes,
      ]}
    />
  );
}
export function StopsPage() {
  const c = useChoices();
  return (
    <ResourceManager
      table="load_stops"
      title="Stops & Appointments"
      subtitle="Multi-stop schedules, facility contacts and arrival/departure history. Enter appointment times in your device’s local timezone."
      columns={["load_id", "sequence", "kind", "facility", "address", "appointment_at"]}
      fields={[
        { ...c.load, required: true },
        { ...number("sequence", "Stop order", true), min: 1, step: "1", default: "1" },
        choice("kind", "Stop type", ["pickup", "delivery", "waypoint"]),
        text("facility", "Facility"),
        text("address", "Full address", true),
        { key: "appointment_at", label: "Appointment (local time)", type: "datetime-local" },
        { key: "arrived_at", label: "Arrived (local time)", type: "datetime-local" },
        { key: "departed_at", label: "Departed (local time)", type: "datetime-local" },
        text("contact", "Contact / phone"),
        text("reference", "Appointment reference"),
        notes,
      ]}
      validate={(r) =>
        r["arrived_at"] && r["departed_at"] && String(r["departed_at"]) < String(r["arrived_at"])
          ? "Departure cannot precede arrival"
          : undefined
      }
    />
  );
}
export function CompliancePage() {
  const c = useChoices(), q = useList("compliance_records"), rows = q.data ?? [], todayDate = today(), soon = new Date(todayDate + "T12:00:00");
  soon.setDate(soon.getDate() + 30);
  const soonDate = soon.toISOString().slice(0, 10);
  return (
    <ResourceManager
      table="compliance_records"
      title="Renewals & Compliance"
      subtitle="Track recorded expiry dates for driver and equipment documents. This register does not verify authority or legal compliance."
      columns={["document_type", "driver_id", "truck_id", "reference", "expiry_date"]}
      fields={[
        c.driver,
        c.truck,
        choice("document_type", "Document", [
          "Insurance",
          "CDL",
          "Medical card",
          "Registration",
          "Annual inspection",
          "TWIC",
          "Other",
        ]),
        text("reference", "Document reference"),
        date("expiry_date", "Expiry date", true),
        notes,
      ]}
      validate={(r) =>
        !r["driver_id"] && !r["truck_id"] ? "Choose a driver or equipment record" : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Documents tracked" value={rows.length} hint="Driver and equipment files" />
        <Kpi label="Expiring in 30 days" value={rows.filter((r) => r.expiry_date && r.expiry_date >= todayDate && r.expiry_date <= soonDate).length} hint="Safety team follow-up" color="--st-transit" />
        <Kpi label="Expired" value={rows.filter((r) => r.expiry_date && r.expiry_date < todayDate).length} hint="Dispatch hold recommended" color="--st-cancelled" />
      </div>
    </ResourceManager>
  );
}
