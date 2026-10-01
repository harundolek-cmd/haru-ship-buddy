import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/tms/ui";
import { Brand } from "@/components/tms/Brand";

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
      if (data.session) navigate({ to: "/pano" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/pano" });
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
          emailRedirectTo: window.location.origin + "/pano",
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
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Brand /></div>
        <div className="panel p-6">
          <h1 className="text-lg font-semibold tracking-tight">{mode === "login" ? "Giriş yap" : "Hesap kurulumu"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Operasyon panelinize erişin." : "İlk kayıt olan kullanıcı yönetici olur."}
          </p>
          <form onSubmit={submit} className="mt-5 grid gap-3">
            {mode === "signup" && (
              <>
                <Field label="Ad Soyad"><Input required value={form.full_name} onChange={set("full_name")} /></Field>
                <Field label="Şirket adı"><Input value={form.company_name} onChange={set("company_name")} placeholder="Örn. Haru Lojistik" /></Field>
              </>
            )}
            <Field label="E-posta"><Input type="email" required value={form.email} onChange={set("email")} /></Field>
            <Field label="Şifre"><Input type="password" required minLength={6} value={form.password} onChange={set("password")} /></Field>
            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? "Bekleyin…" : mode === "login" ? "Giriş yap" : "Hesabı oluştur"}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />veya<span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>Google ile devam et</Button>
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 w-full text-center text-sm text-primary hover:underline"
          >
            {mode === "login" ? "Hesabınız yok mu? Hesap kurun" : "Zaten hesabınız var mı? Giriş yapın"}
          </button>
        </div>
      </div>
    </div>
  );
}
