import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, TableShell, Th, Td, Empty } from "@/components/tms/ui";
import { useList } from "@/lib/tms";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/belgeler")({
  head: () => ({
    meta: [
      { title: "BOL / POD Belgeleri — HARU TMS" },
      { name: "description", content: "Yüklenen tüm BOL ve POD belgeleri." },
      { property: "og:title", content: "BOL / POD Belgeleri — HARU TMS" },
      { property: "og:description", content: "Yüklenen tüm BOL ve POD belgeleri." },
    ],
  }),
  component: Belgeler,
});

function Belgeler() {
  const { data: docs = [], isLoading } = useList("documents");
  const loads = useList("loads").data ?? [];

  async function open(path: string) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Belge açılamadı"); return; }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <PageHeader
        title="BOL / POD Belgeleri"
        subtitle="Yeni belge yüklemek için Görevler sayfasındaki + BOL / + POD düğmelerini kullanın"
        action={<Button asChild variant="outline"><Link to="/gorevler">Görevlere git</Link></Button>}
      />
      <Panel title="Belge Arşivi" right={<span className="font-mono text-[11px] text-muted-foreground">{docs.length} belge</span>}>
        {isLoading ? <Empty text="Yükleniyor…" /> : !docs.length ? <Empty text="Henüz belge yüklenmedi." /> : (
          <TableShell head={<><Th>Tür</Th><Th>Dosya</Th><Th>Görev</Th><Th>Tarih</Th><Th /></>}>
            {docs.map((d) => {
              const l = loads.find((x) => x.id === d.load_id);
              return (
                <tr key={d.id}>
                  <Td><span className={d.doc_type === "BOL" ? "rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] text-primary" : "rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[11px] text-accent"}>{d.doc_type}</span></Td>
                  <Td className="font-mono text-xs">{d.file_name}</Td>
                  <Td>{l ? <><span className="font-mono">#{4820 + l.load_no}</span> <span className="text-muted-foreground">{l.origin} → {l.destination}</span></> : "—"}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("tr-TR")}</Td>
                  <Td className="text-right"><button onClick={() => open(d.file_path)} className="text-xs font-medium text-primary hover:underline">Görüntüle</button></Td>
                </tr>
              );
            })}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
