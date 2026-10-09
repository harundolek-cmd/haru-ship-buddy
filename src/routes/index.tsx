import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/tms/Brand";

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
  ["▤", "Görev yönetimi", "Yük oluştur, sürücü ve dispatcher ata, durumu canlı takip et."],
  ["▢", "BOL / POD", "Her yük için belgeleri yükle, tek tıkla görüntüle."],
  ["◍", "Ekip sohbeti", "Dispatcher ekipleri için anlık sohbet odaları."],
];

function Index() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b bg-card/60 px-6">
        <Brand />
        <Link to={signedIn ? "/dashboard" : "/auth"} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          {signedIn ? "Panoya git" : "Giriş yap"}
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Lojistik operasyon merkezi</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Filonuzu tek bir kontrol kulesinden yönetin.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground text-pretty">
          HARU TMS; yükleri, sürücüleri, rotaları, dispatcher ekiplerini ve BOL/POD belgelerini tek bir sakin panelde toplar.
        </p>
        <div className="mt-8">
          <Link to={signedIn ? "/dashboard" : "/auth"} className="inline-flex items-center gap-2 rounded-md bg-primary py-2 pl-2 pr-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <span className="font-mono">＋</span> {signedIn ? "Panoya git" : "Hesap oluştur"}
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {features.map(([icon, title, text]) => (
            <div key={title} className="panel p-5">
              <span className="font-mono text-primary">{icon}</span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
