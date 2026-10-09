import {
  LayoutDashboard,
  Package,
  MapPinned,
  ShieldCheck,
  Files,
  Users,
  Truck,
  Route as RouteIcon,
  Wallet,
  UsersRound,
  MessagesSquare,
  Settings,
  LogOut,
  ClipboardList,
  Building2,
  FileText,
  Receipt,
  Wrench,
  BarChart3,
  CalendarClock,
  Shield,
  Plug,
  Search,
  Bell,
  Plus,
  ChevronDown,
} from "lucide-react";
import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/tms";
import { Avatar } from "@/components/tms/ui";
import { Brand } from "@/components/tms/Brand";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

const groups = [
  {
    label: "Operations",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/loads", label: "Loads", icon: Package },
      { to: "/planner", label: "Dispatch Board", icon: LayoutDashboard },
      { to: "/stops", label: "Stops & Appointments", icon: CalendarClock },
      { to: "/tasks", label: "Tasks & Follow-ups", icon: ClipboardList },
      { to: "/map", label: "Fleet Locations", icon: MapPinned },
      { to: "/documents", label: "Documents", icon: Files },
    ],
  },
  {
    label: "Fleet",
    items: [
      { to: "/drivers", label: "Drivers", icon: Users },
      { to: "/trucks", label: "Trucks & Trailers", icon: Truck },
      { to: "/lanes", label: "Lanes", icon: RouteIcon },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/driver-pay", label: "Driver Pay", icon: Wallet },
      { to: "/invoices", label: "Invoice Desk", icon: Receipt },
      { to: "/expenses", label: "Expenses", icon: Wallet },
      { to: "/reports", label: "Revenue Center", icon: BarChart3 },
    ],
  },
  {
    label: "Risk & Safety",
    items: [
      { to: "/compliance", label: "Safety Center", icon: Shield },
      { to: "/permits", label: "Permit Desk", icon: ShieldCheck },
      { to: "/maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
  {
    label: "Commercial",
    items: [
      { to: "/partners", label: "Customers & Partners", icon: Building2 },
      { to: "/quotes", label: "Quotes", icon: FileText },
      { to: "/integrations", label: "Integrations", icon: Plug },
    ],
  },
  {
    label: "Team",
    items: [
      { to: "/dispatchers", label: "Dispatchers & Teams", icon: UsersRound },
      { to: "/chat", label: "Chat", icon: MessagesSquare },
    ],
  },
] as const;

function AppShell() {
  const { user, profile, isAdmin, company } = useCurrentUser();
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="workspace flex min-h-screen">
      <aside className="workspace-sidebar no-print sticky top-0 flex h-dvh w-16 shrink-0 flex-col text-sidebar-foreground sm:w-64">
        <div className="flex h-[76px] items-center justify-center border-b border-sidebar-border sm:justify-start sm:px-5">
          <span className="hidden sm:block">
            <Brand dark />
          </span>
          <span
            className="brand-mark grid size-9 place-items-center rounded-xl text-sm font-bold text-white sm:hidden"
            aria-label="HARU TMS"
          >
            H
          </span>
        </div>
        <div className="hidden border-b border-sidebar-border px-4 py-3 sm:block">
          <button className="flex w-full items-center justify-between rounded-lg bg-white/8 px-3 py-2 text-left hover:bg-white/12">
            <span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">{company?.name ?? "HARU Logistics"}</span><span className="mt-0.5 block text-[10px] text-sidebar-foreground">Operations workspace</span></span>
            <ChevronDown className="size-4 shrink-0" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-5 text-[13px] sm:px-3">
          {groups
            .filter((g) => g.label !== "Accounting" || isAdmin)
            .map((g) => (
              <div key={g.label}>
                <div className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/80 sm:block">
                  {g.label}
                </div>
                {g.items.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    aria-label={n.label}
                    title={n.label}
                    className="nav-item justify-center sm:justify-start"
                    activeProps={{ className: "font-semibold" }}
                  >
                    <n.icon className="size-[18px] shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{n.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          {isAdmin && (
            <div>
              <div className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/80 sm:block">
                Admin
              </div>
              <Link
                aria-label="Company & Users"
                title="Company & Users"
                to="/settings"
                className="nav-item justify-center sm:justify-start"
                activeProps={{ className: "font-semibold" }}
              >
                <Settings className="size-[18px] shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Company & Users</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex min-h-[76px] items-center justify-between gap-3 border-b bg-card px-3 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden size-9 place-items-center rounded-xl bg-secondary text-primary sm:grid"><Search className="size-4" /></div>
            <div className="min-w-0"><div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Operations / Today</div><div className="truncate text-sm font-semibold">Good morning, {profile?.full_name?.split(" ")[0] ?? "Dispatcher"}</div></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button className="hidden items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted md:flex"><Search className="size-3.5" /> Search anything <kbd className="rounded border bg-card px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd></button>
            <button className="relative rounded-lg border p-2 text-muted-foreground hover:bg-muted" aria-label="Notifications"><Bell className="size-4" /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-500" /></button>
            <button className="primary-action hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white sm:flex"><Plus className="size-3.5" /> New load</button>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary md:inline-flex">
              {isAdmin ? "Admin" : "Dispatcher"}
            </span>
            <Avatar name={profile?.full_name ?? user?.email ?? null} className="size-8" />
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium">{profile?.full_name ?? "…"}</div>
              <div className="text-[11px] text-muted-foreground">{user?.email}</div>
            </div>
            <button
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex items-center gap-2 rounded-lg border p-2 text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 space-y-6 p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
