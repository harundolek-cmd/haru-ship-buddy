import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Download, Search, AlertCircle } from "lucide-react";
import { resourceDb, type ResourceName } from "@/lib/business-db";
import { useRecords, errorText, exportCsv } from "@/lib/business";
import { useCurrentUser } from "@/lib/tms";
import { usd } from "@/lib/equipment";
import {
  PageHeader,
  Panel,
  Field,
  Empty,
  TableShell,
  Th,
  Td,
  selectCls,
} from "@/components/tms/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export type Row = Record<string, unknown> & { id: string };
export type Option = { value: string; label: string };
export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "textarea";
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  options?: Option[];
  default?: string;
  money?: boolean;
  hidden?: boolean;
};
export const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
export function QueryNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle className="size-4" />
        Unable to load records
      </div>
      <p className="mt-1">{errorText(error)}</p>
      {retry && (
        <Button variant="outline" className="mt-3" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function ResourceManager({
  table,
  title,
  subtitle,
  fields,
  columns,
  adminOnly = false,
  validate,
  actions,
  children,
  defaultValues = {},
  filterRows,
  readOnly = false,
  canEditRow,
}: {
  table: ResourceName;
  title: string;
  subtitle: string;
  fields: ResourceField[];
  columns?: string[];
  adminOnly?: boolean;
  validate?: (row: Record<string, unknown>) => string | undefined;
  actions?: (row: Row) => ReactNode;
  children?: ReactNode;
  defaultValues?: Record<string, unknown>;
  filterRows?: (row: Row) => boolean;
  readOnly?: boolean;
  canEditRow?: (row: Row) => boolean;
}) {
  const query = useRecords(table),
    qc = useQueryClient();
  const { companyId, isAdmin } = useCurrentUser();
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [editing, setEditing] = useState<Row | null | undefined>(undefined),
    [values, setValues] = useState<Record<string, string>>({}),
    [saving, setSaving] = useState(false);
  const canEdit = (!adminOnly || isAdmin) && !readOnly;
  const statusField = fields.find((f) => f.key === "status");
  const visible = fields.filter((f) => !f.hidden && (!columns || columns.includes(f.key)));
  const all = (query.data ?? []) as unknown as Row[];
  const rows = all.filter(
    (r) =>
      (!filterRows || filterRows(r)) &&
      (filter === "all" || r["status"] === filter) &&
      fields.some((f) =>
        String(r[f.key] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
  );
  function open(row: Row | null) {
    setEditing(row);
    setValues(
      Object.fromEntries(
        fields.map((f) => {
          const v = row?.[f.key] ?? defaultValues[f.key] ?? f.default ?? "";
          return [
            f.key,
            f.type === "datetime-local" && v
              ? new Date(
                  new Date(String(v)).getTime() - new Date(String(v)).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)
              : String(v),
          ];
        }),
      ),
    );
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !companyId) return;
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const v = (values[f.key] ?? "").trim();
      if (f.required && !v) {
        toast.error(`${f.label} is required`);
        return;
      }
      if (
        v &&
        f.type === "number" &&
        (!Number.isFinite(Number(v)) ||
          (f.min !== undefined && Number(v) < f.min) ||
          (f.max !== undefined && Number(v) > f.max))
      ) {
        toast.error(`Invalid ${f.label}`);
        return;
      }
      if (v && f.options && !f.options.some((o) => o.value === v)) {
        toast.error(`Invalid ${f.label}`);
        return;
      }
      payload[f.key] =
        v === ""
          ? null
          : f.type === "number"
            ? Number(v)
            : f.type === "datetime-local"
              ? new Date(v).toISOString()
              : v;
    }
    const validation = validate?.(payload);
    if (validation) {
      toast.error(validation);
      return;
    }
    setSaving(true);
    try {
      const result = editing
        ? await resourceDb
            .from(table)
            .update(payload)
            .eq("id", editing.id)
            .eq("company_id", companyId)
            .select("id")
        : await resourceDb
            .from(table)
            .insert({ ...payload, company_id: companyId })
            .select("id");
      if (result.error) throw result.error;
      if (!result.data?.length)
        throw new Error("Record was not saved. Check your access and try again.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["business", table] }),
        qc.invalidateQueries({ queryKey: [table] }),
      ]);
      toast.success("Record saved");
      setEditing(undefined);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setSaving(false);
    }
  }
  const format = (r: Row, f: ResourceField) =>
    f.options?.find((o) => o.value === r[f.key])?.label ??
    (f.money ? usd(Number(r[f.key] ?? 0)) : String(r[f.key] ?? "—"));
  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          canEdit && (
            <Button onClick={() => open(null)} disabled={!!query.error || query.isLoading}>
              <Plus />
              Add record
            </Button>
          )
        }
      />
      {children}
      {adminOnly && !isAdmin ? (
        <Empty text="Only company administrators can access this financial module." />
      ) : query.error ? (
        <QueryNotice error={query.error} retry={() => query.refetch()} />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label={`Search ${title}`}
                className="bg-card pl-9"
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {statusField?.options && (
              <select
                aria-label="Filter status"
                className={selectCls + " max-w-44"}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {statusField.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            <Button
              variant="outline"
              onClick={() =>
                exportCsv(
                  `${table}.csv`,
                  visible.map((f) => f.label),
                  rows.map((r) => visible.map((f) => format(r, f))),
                )
              }
            >
              <Download />
              CSV
            </Button>
          </div>
          <Panel title={`${rows.length} records`}>
            {query.isLoading ? (
              <Empty text="Loading records…" />
            ) : !rows.length ? (
              <Empty text="No records match. Add a record to get started." />
            ) : (
              <TableShell
                head={
                  <>
                    {visible.map((f) => (
                      <Th key={f.key}>{f.label}</Th>
                    ))}
                    <Th>Actions</Th>
                  </>
                }
              >
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/40">
                    {visible.map((f) => (
                      <Td key={f.key}>
                        {f.key === "status" ? (
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {format(r, f)}
                          </span>
                        ) : (
                          <span className="block max-w-64 whitespace-pre-wrap break-words">
                            {format(r, f)}
                          </span>
                        )}
                      </Td>
                    ))}
                    <Td>
                      <div className="flex items-center gap-2">
                        {canEdit && (!canEditRow || canEditRow(r)) && (
                          <Button variant="ghost" size="sm" onClick={() => open(r)}>
                            <Pencil />
                            Edit
                          </Button>
                        )}
                        {actions?.(r)}
                      </div>
                    </Td>
                  </tr>
                ))}
              </TableShell>
            )}
          </Panel>
        </>
      )}
      <Dialog
        open={editing !== undefined}
        onOpenChange={(o) => {
          if (!o && !saving) setEditing(undefined);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit record" : "New record"} · {title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <Field
                key={f.key}
                label={f.label + (f.required ? " *" : "")}
                className={f.type === "textarea" ? "sm:col-span-2" : ""}
              >
                {f.options ? (
                  <select
                    required={f.required}
                    className={selectCls}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    className="min-h-24 rounded-lg border bg-card p-3 text-sm"
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    required={f.required}
                    type={f.type ?? "text"}
                    min={f.min}
                    max={f.max}
                    step={f.step ?? (f.type === "number" ? "0.01" : undefined)}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                )}
              </Field>
            ))}
            <Button disabled={saving} className="sm:col-span-2" type="submit">
              {saving ? "Saving…" : "Save record"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
