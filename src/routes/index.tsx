import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/tms/Brand";
import { ArrowRight, BarChart3, CircleCheck, Map, Radio, ShieldCheck, Truck, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HARU TMS — Dispatcher Lojistik Yönetim Sistemi" },
      { name: "description", content: "Yükler, sürücüler, rotalar, BOL/POD belgeleri, ekipler ve sohbet tek panelde." },
      { property: "og:title", content: "HARU TMS — Dispatcher Lojistik Yönetim Sistemi" },
      { property: "og:description", content: "Yükler, sürücüler, rotalar, BOL/POD belgeleri, ekipler ve sohbet tek panelde." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Radio, title: "Live dispatch board", text: "See every booked, dispatched and in-transit load in one operational view." },
  { icon: BarChart3, title: "Revenue control", text: "Track monthly revenue, dispatcher totals, invoices and outstanding receivables." },
  { icon: ShieldCheck, title: "Safety & permits", text: "Keep driver files, inspections and oversize permits ahead of expiry." },
];

function Index() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="landing-shell min-h-screen overflow-hidden bg-background">
      <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/10 bg-[#102b31]/95 px-6 text-white backdrop-blur sm:px-10">
        <Brand dark />
        <Link to={signedIn ? "/dashboard" : "/auth"} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#12383d] hover:bg-teal-50">
          {signedIn ? "Open workspace" : "Sign in"} <ArrowRight className="size-4" />
        </Link>
      </header>
      <main>
        <section className="landing-hero relative px-6 pb-24 pt-20 text-white sm:px-10 lg:px-20 lg:pb-32 lg:pt-28">
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_0.9fr]">
            <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">The carrier operating system</p><h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Dispatch smarter.<br /><span className="text-teal-300">Deliver more.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">HARU TMS brings loads, drivers, revenue, safety and documents into one calm command center for modern trucking teams.</p><div className="mt-9 flex flex-wrap gap-3"><Link to={signedIn ? "/dashboard" : "/auth"} className="flex items-center gap-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-semibold text-[#0f3439] hover:bg-teal-200">{signedIn ? "Open your workspace" : "Build your workspace"}<ArrowRight className="size-4" /></Link><Link to="/auth" className="rounded-xl border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">See how it works</Link></div><div className="mt-10 flex flex-wrap gap-5 text-xs text-slate-300"><span className="flex items-center gap-2"><CircleCheck className="size-4 text-teal-300" /> Load visibility</span><span className="flex items-center gap-2"><CircleCheck className="size-4 text-teal-300" /> Revenue intelligence</span><span className="flex items-center gap-2"><CircleCheck className="size-4 text-teal-300" /> Safety workflows</span></div></div>
            <div className="landing-dashboard relative"><div className="absolute -inset-10 rounded-full bg-teal-300/10 blur-3xl" /><div className="relative rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div><div className="text-[10px] uppercase tracking-[0.18em] text-teal-200">HARU operations</div><div className="mt-1 font-semibold">Today’s dispatch board</div></div><span className="rounded-full bg-emerald-300/15 px-2 py-1 text-[10px] font-semibold text-emerald-200">Live</span></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-black/15 p-3"><div className="text-[10px] text-slate-300">Active loads</div><div className="mt-2 text-2xl font-semibold">42</div></div><div className="rounded-xl bg-black/15 p-3"><div className="text-[10px] text-slate-300">On route</div><div className="mt-2 text-2xl font-semibold text-amber-200">18</div></div><div className="rounded-xl bg-black/15 p-3"><div className="text-[10px] text-slate-300">Revenue</div><div className="mt-2 text-2xl font-semibold text-teal-200">$84k</div></div></div><div className="mt-4 space-y-2"><div className="flex items-center gap-3 rounded-xl bg-white/90 p-3 text-[#17353a]"><span className="grid size-8 place-items-center rounded-lg bg-teal-100 text-teal-700"><Truck className="size-4" /></span><div className="min-w-0 flex-1"><div className="text-xs font-semibold">Houston → Chicago</div><div className="mt-1 text-[10px] text-slate-500">TRK-204 · In transit</div></div><span className="text-xs font-semibold text-emerald-600">On time</span></div><div className="flex items-center gap-3 rounded-xl bg-white/90 p-3 text-[#17353a]"><span className="grid size-8 place-items-center rounded-lg bg-sky-100 text-sky-700"><Map className="size-4" /></span><div className="min-w-0 flex-1"><div className="text-xs font-semibold">Dallas → Phoenix</div><div className="mt-1 text-[10px] text-slate-500">TRK-119 · Pickup today</div></div><span className="text-xs font-semibold text-amber-600">2h</span></div></div><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-300"><span className="flex items-center gap-2"><Zap className="size-3.5 text-amber-300" /> 74% fleet utilization</span><span>View board →</span></div></div></div>
          </div>
          <div className="landing-road"><span className="landing-truck">▰</span></div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-20"><div className="grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <div key={title} className="panel feature-card p-6"><div className="grid size-11 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="size-5" /></div><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></section>
      </main>
    </div>
  );
}
