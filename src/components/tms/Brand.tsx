import { cn } from "@/lib/utils";

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-8 place-items-center rounded-md bg-primary">
        <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" />
        </svg>
      </div>
      <div>
        <div className={cn("text-sm font-bold leading-none tracking-tight", dark ? "text-sidebar-accent-foreground" : "text-foreground")}>HARU TMS</div>
        <div className={cn("mt-0.5 text-[10px] uppercase tracking-widest", dark ? "text-sidebar-foreground/70" : "text-muted-foreground")}>Dispatch Suite</div>
      </div>
    </div>
  );
}
