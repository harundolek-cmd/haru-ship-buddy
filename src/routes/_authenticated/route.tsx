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
      { to: "/dashboard", label: "Dashboard" },
      { to: "/loads", label: "Loads" },
      { to: "/map", label: "Live Map" },
      { to: "/permits", label: "Permits" },
      { to: "/documents", label: "Documents" },
    ],
  },
  {
    label: "Fleet",
    items: [
      { to: "/drivers", label: "Drivers" },
      { to: "/trucks", label: "Trucks & Trailers" },
      { to: "/lanes", label: "Lanes" },
    ],
  },
  {
    label: "Accounting",
    items: [{ to: "/driver-pay", label: "Driver Pay" }],
  },
  {
    label: "Team",
    items: [
      { to: "/dispatchers", label: "Dispatchers & Teams" },
      { to: "/chat", label: "Chat" },
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
    <div className="flex min-h-screen bg-background">
      <aside className="no-print sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4"><Brand dark /></div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4 text-[13px]">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">{g.label}</div>
              {g.items.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="block rounded-md px-3 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground font-medium" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
          {isAdmin && (
            <div>
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">Admin</div>
              <Link to="/settings" className="block rounded-md px-3 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground font-medium" }}>
                Company & Users
              </Link>
            </div>
          )}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{company?.name ?? "…"}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {[company?.mc_number, company?.dot_number && `DOT ${company.dot_number}`].filter(Boolean).join(" · ") || "Add MC / DOT in Company settings"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isAdmin ? "Admin" : "Dispatcher"}
            </span>
            <Avatar name={profile?.full_name ?? user?.email ?? null} className="size-8" />
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium">{profile?.full_name ?? "…"}</div>
              <div className="text-[11px] text-muted-foreground">{user?.email}</div>
            </div>
            <button onClick={signOut} className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted">Sign out</button>
          </div>
        </header>
        <main className="flex-1 space-y-5 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
