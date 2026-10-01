import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

const nav = [
  { to: "/pano", icon: "▣", label: "Pano" },
  { to: "/gorevler", icon: "▤", label: "Görevler" },
  { to: "/suruculer", icon: "◐", label: "Sürücüler" },
  { to: "/rotalar", icon: "✦", label: "Rotalar" },
  { to: "/dispatcherlar", icon: "◈", label: "Dispatcherlar" },
  { to: "/ekipler", icon: "❖", label: "Ekipler" },
  { to: "/sohbet", icon: "◍", label: "Sohbet" },
  { to: "/belgeler", icon: "▢", label: "Belgeler" },
  { to: "/yonetici", icon: "⚙", label: "Yönetici" },
] as const;

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const d = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }).toLocaleUpperCase("tr");
  const t = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return <span className="font-mono text-xs font-medium text-muted-foreground">{d} · {t}</span>;
}

function AppShell() {
  const { profile, isAdmin } = useCurrentUser();
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
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex h-14 items-center border-b px-5"><Brand /></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-foreground/5"
              activeProps={{ className: "!bg-primary/10 !text-primary font-medium" }}
            >
              <span className="grid size-4 place-items-center font-mono">{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-background p-3 ring-1 ring-foreground/5">
            <Avatar name={profile?.full_name ?? null} className="size-8" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{profile?.full_name ?? "…"}</div>
              <div className="text-[10px] text-muted-foreground">{isAdmin ? "Yönetici" : "Dispatcher"}</div>
            </div>
            <button onClick={signOut} title="Çıkış yap" className="font-mono text-xs text-muted-foreground hover:text-destructive">⏻</button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card/60 px-6">
          <Clock />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" /> Sistem Çevrimiçi
            {profile?.company_name && (<><span className="mx-2 h-5 w-px bg-border" />{profile.company_name}</>)}
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
