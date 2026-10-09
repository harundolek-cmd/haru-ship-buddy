import { useQuery } from "@tanstack/react-query";
import { resourceDb, type BusinessDatabase, type ResourceName } from "./business-db";
import { useCurrentUser } from "./tms";
export function useRecords<T extends ResourceName>(table: T) {
  const { companyId } = useCurrentUser();
  return useQuery({
    queryKey: ["business", table, companyId],
    enabled: !!companyId,
    retry: 1,
    queryFn: async () => {
      const rows: BusinessDatabase["public"]["Tables"][T]["Row"][] = [];
      for (let offset = 0; offset < 100000; offset += 1000) {
        const { data, error } = await resourceDb
          .from(table as ResourceName)
          .select("*")
          .eq("company_id", companyId!)
          .order("created_at", { ascending: false })
          .order("id")
          .range(offset, offset + 999);
        if (error) throw error;
        rows.push(...(data as unknown as BusinessDatabase["public"]["Tables"][T]["Row"][]));
        if (data.length < 1000) return rows;
      }
      throw new Error(
        "This report exceeds 100,000 records. Narrow the reporting scope before continuing.",
      );
    },
  });
}
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const money = (n: unknown) => Number(n ?? 0);
export const cents = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function loadRevenue(l: {
  rate: number | null;
  detention: number | null;
  lumper: number | null;
}) {
  return cents(money(l.rate) + money(l.detention) + money(l.lumper));
}
export function invoiceState(
  i: { status: string; total: number; paid_amount: number; due_date: string },
  date = today(),
) {
  if (i.status === "void" || i.status === "draft") return i.status;
  if (cents(i.total - i.paid_amount) <= 0) return "paid";
  if (i.due_date < date) return "overdue";
  return i.paid_amount > 0 ? "partial" : "unpaid";
}
export function agingBucket(due: string, date = today()) {
  const days = Math.floor(
    (Date.parse(date + "T00:00:00Z") - Date.parse(due + "T00:00:00Z")) / 86400000,
  );
  return days <= 0
    ? "Current"
    : days <= 30
      ? "1–30"
      : days <= 60
        ? "31–60"
        : days <= 90
          ? "61–90"
          : "90+";
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function exportCsv(filename: string, headers: string[], rows: unknown[][]) {
  const blob = new Blob(
    ["\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function errorText(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (["42P01", "PGRST205", "PGRST202"].includes(e?.code ?? ""))
    return "This module needs a database update. Ask your administrator to finish the business-module setup.";
  return e?.message || "The request failed. Please try again.";
}
