import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  initials, loadStatusLabel, loadStatusVar, driverStatusLabel, driverStatusVar,
  type LoadStatus, type DriverStatus,
} from "@/lib/tms";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{action}</div>
    </div>
  );
}

export function Panel({ title, right, children, className }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b bg-secondary/40 px-4 py-3.5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-secondary-foreground">{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, color, onClick }: { label: string; value: ReactNode; hint?: string; color?: string; onClick?: () => void }) {
  return (
    <div role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onClick={onClick} onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) onClick(); }} className={cn("panel kpi-card relative overflow-hidden p-4 sm:p-5", onClick && "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg")} style={{ "--kpi-color": `var(${color ?? "--primary"})` } as CSSProperties}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="relative z-10 my-2 break-words font-mono text-2xl font-semibold tabular-nums text-[var(--kpi-color)]">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  return (
    <span className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary", className)}>
      {initials(name)}
    </span>
  );
}

export function StatusBadge({ label, colorVar }: { label: string; colorVar: string }) {
  const style = { "--c": `var(${colorVar})` } as CSSProperties;
  return (
    <span style={style} className="status-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
export function LoadStatusPill({ status }: { status: LoadStatus }) {
  return <StatusBadge label={loadStatusLabel[status]} colorVar={loadStatusVar[status]} />;
}
export function DriverStatusPill({ status }: { status: DriverStatus }) {
  return <StatusBadge label={driverStatusLabel[status]} colorVar={driverStatusVar[status]} />;
}

export function DocDots({ bol, pod }: { bol: boolean; pod: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]">
      <span className={cn("size-1.5 rounded-full", bol ? "bg-[var(--st-delivered)]" : "bg-border")} />BOL
      <span className={cn("ml-1 size-1.5 rounded-full", pod ? "bg-[var(--st-delivered)]" : "bg-border")} />POD
    </span>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-3 py-2 text-left font-semibold", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}
export function TableShell({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="bg-secondary/60">
          <tr className="border-b text-[10.5px] uppercase tracking-wider text-muted-foreground">{head}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid gap-1 text-sm", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const selectCls =
  "h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
