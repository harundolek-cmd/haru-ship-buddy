import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { initials, loadStatusLabel, driverStatusLabel, type LoadStatus, type DriverStatus } from "@/lib/tms";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground text-pretty">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, right, children, className }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  return (
    <span className={cn("grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 font-mono text-[10px] font-medium text-primary", className)}>
      {initials(name)}
    </span>
  );
}

const loadTone: Record<LoadStatus, string> = {
  rezerve: "bg-foreground/5 text-muted-foreground",
  sevk_edildi: "bg-accent/15 text-accent",
  yolda: "bg-primary/10 text-primary",
  teslim_edildi: "bg-primary/15 text-primary",
  iptal: "bg-destructive/10 text-destructive",
};
export function LoadStatusPill({ status }: { status: LoadStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", loadTone[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {loadStatusLabel[status]}
    </span>
  );
}

const driverTone: Record<DriverStatus, string> = {
  musait: "bg-primary/10 text-primary",
  gorevde: "bg-accent/15 text-accent",
  izinli: "bg-foreground/5 text-muted-foreground",
};
export function DriverStatusPill({ status }: { status: DriverStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", driverTone[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {driverStatusLabel[status]}
    </span>
  );
}

export function DocDots({ bol, pod }: { bol: boolean; pod: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span className={cn("size-1.5 rounded-full", bol ? "bg-primary" : "bg-border")} />BOL
      <span className="text-muted-foreground">·</span>
      <span className={cn("size-1.5 rounded-full", pod ? "bg-primary" : "bg-border")} />POD
    </span>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 text-left font-medium", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}
export function TableShell({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-[11px] uppercase tracking-wide text-muted-foreground">{head}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const selectCls =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
