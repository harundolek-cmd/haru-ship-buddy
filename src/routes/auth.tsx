import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/tms/ui";
import { Brand } from "@/components/tms/Brand";
import { ArrowRight, CheckCircle2, LockKeyhole, Radar, Route as RouteIcon, Truck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş / Hesap Kurulumu — HARU TMS" },
      { name: "description", content: "HARU TMS hesabınıza giriş yapın veya şirket hesabınızı kurun." },
      { property: "og:title", content: "Giriş / Hesap Kurulumu — HARU TMS" },
      { property: "og:description", content: "HARU TMS hesabınıza giriş yapın veya şirket hesabınızı kurun." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", company_name: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) toast.error("Giriş başarısız: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: form.full_name, company_name: form.company_name },
        },
      });
      if (error) toast.error(error.message);
      else toast.success("Hesap oluşturuldu! E-postanızdaki onay bağlantısına tıklayın.");
    }
    setLoading(false);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Google ile giriş başarısız");
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-shell grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="auth-hero relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="relative z-10"><Brand dark /><div className="mt-24 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">The modern carrier operating system</p><h2 className="mt-5 text-5xl font-semibold leading-[1.03] tracking-[-0.04em] xl:text-6xl">Move freight<br /><span className="text-teal-300">with confidence.</span></h2><p className="mt-6 max-w-md text-base leading-7 text-slate-300">One command center for loads, drivers, safety, permits and revenue. Built for the pace of American trucking.</p></div></div>
        <div className="relative z-10 grid max-w-2xl grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"><Radar className="size-5 text-teal-300" /><p className="mt-6 text-xs text-slate-300">Live load visibility</p></div><div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"><RouteIcon className="size-5 text-sky-300" /><p className="mt-6 text-xs text-slate-300">Smarter dispatch</p></div><div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur"><Truck className="size-5 text-amber-300" /><p className="mt-6 text-xs text-slate-300">Fleet-ready workflows</p></div></div>
        <div className="auth-road"><span className="auth-truck">▰</span></div>
      </section>
      <section className="auth-form-side flex items-center justify-center px-4 py-10 sm:px-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between lg:hidden"><Brand /><span className="text-xs text-muted-foreground">Dispatch Suite</span></div>
        <div className="mb-8 hidden lg:block"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Welcome back</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{mode === "login" ? "Sign in to your workspace" : "Create your workspace"}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Your operation is waiting." : "Set up your carrier operation in minutes."}</p></div>
        <div className="panel auth-card p-6 sm:p-8">
          <div className="mb-6 lg:hidden"><h1 className="text-2xl font-bold tracking-tight">{mode === "login" ? "Sign in" : "Create account"}</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Access your operations workspace." : "The first account becomes company admin."}
          </p>
          <form onSubmit={submit} className="mt-5 grid gap-3">
            {mode === "signup" && (
              <>
                <Field label="Full name"><Input required value={form.full_name} onChange={set("full_name")} /></Field>
                <Field label="Company name"><Input value={form.company_name} onChange={set("company_name")} placeholder="e.g. HARU Logistics" /></Field>
              </>
            )}
            <Field label="Work email"><Input type="email" required value={form.email} onChange={set("email")} /></Field>
            <Field label="Password"><Input type="password" required minLength={6} value={form.password} onChange={set("password")} /></Field>
            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create workspace"} <ArrowRight className="size-4" />
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />veya<span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><LockKeyhole className="size-3" /> Secure company workspace</div>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
          >
            {mode === "login" ? "Need a workspace? Create one" : "Already have a workspace? Sign in"}
          </button>
        </div>
        </div>
        <div className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3"><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-600" /> Loadboard</span><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-600" /> Safety center</span><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3 text-emerald-600" /> Revenue control</span></div>
      </div>
      </section>
    </div>
  );
}
