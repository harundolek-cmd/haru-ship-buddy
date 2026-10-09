import { describe, expect, it, vi } from "vitest";
vi.mock("./business-db", () => ({ resourceDb: {} }));
vi.mock("./tms", () => ({ useCurrentUser: () => ({ companyId: null }) }));
import { agingBucket, cents, csvCell, invoiceState, loadRevenue } from "./business";
describe("business calculations", () => {
  it("includes accessorials and handles missing money", () => {
    expect(loadRevenue({ rate: 1000.1, detention: 25.2, lumper: 0.1 })).toBe(1025.4);
    expect(loadRevenue({ rate: null, detention: null, lumper: null })).toBe(0);
    expect(cents(1.005)).toBe(1.01);
  });
  it("keeps draft and void invoices out of overdue status", () => {
    const base = { status: "issued", total: 100, paid_amount: 25, due_date: "2026-10-08" };
    expect(invoiceState(base, "2026-10-09")).toBe("overdue");
    expect(invoiceState({ ...base, status: "draft" }, "2026-10-09")).toBe("draft");
    expect(invoiceState({ ...base, status: "void" }, "2026-10-09")).toBe("void");
    expect(invoiceState({ ...base, paid_amount: 100 }, "2026-10-09")).toBe("paid");
    expect(invoiceState({ ...base, due_date: "2026-10-09" }, "2026-10-09")).toBe("partial");
    expect(invoiceState({ ...base, paid_amount: 0, due_date: "2026-10-09" }, "2026-10-09")).toBe(
      "unpaid",
    );
  });
  it.each([
    [0, "Current"],
    [1, "1–30"],
    [30, "1–30"],
    [31, "31–60"],
    [60, "31–60"],
    [61, "61–90"],
    [90, "61–90"],
    [91, "90+"],
  ])("ages a balance %i days past due", (days, bucket) => {
    const due = new Date(Date.parse("2026-10-09T00:00:00Z") - Number(days) * 86400000)
      .toISOString()
      .slice(0, 10);
    expect(agingBucket(due, "2026-10-09")).toBe(bucket);
  });
  it("escapes CSV values and neutralizes spreadsheet formulas", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell(" =SUM(A1:A2)")).toBe('"\' =SUM(A1:A2)"');
    expect(csvCell(null)).toBe('""');
  });
});
