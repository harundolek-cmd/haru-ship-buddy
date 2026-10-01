import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Avatar, Empty } from "@/components/tms/ui";
import { AddDialog, DeleteBtn } from "@/components/tms/AddDialog";
import { useList } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/ekipler")({
  head: () => ({
    meta: [
      { title: "Ekipler — HARU TMS" },
      { name: "description", content: "Bölgesel dispatcher ve sürücü ekipleri." },
      { property: "og:title", content: "Ekipler — HARU TMS" },
      { property: "og:description", content: "Bölgesel dispatcher ve sürücü ekipleri." },
    ],
  }),
  component: Ekipler,
});

function Ekipler() {
  const { data: teams = [], isLoading } = useList("teams", "name", true);
  const dispatchers = useList("dispatchers").data ?? [];
  const drivers = useList("drivers").data ?? [];
  return (
    <>
      <PageHeader
        title="Ekipler"
        subtitle="Bölgelere göre ekip yapısı"
        action={<AddDialog table="teams" title="Ekip" fields={[{ name: "name", label: "Ekip adı", required: true }, { name: "region", label: "Bölge" }]} />}
      />
      {isLoading ? <Empty text="Yükleniyor…" /> : !teams.length ? <Empty text="Henüz ekip yok." /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((t) => {
            const ds = dispatchers.filter((d) => d.team_id === t.id);
            const dr = drivers.filter((d) => d.team_id === t.id);
            return (
              <div key={t.id} className="panel p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold tracking-tight">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.region ?? "—"}</p>
                  </div>
                  <DeleteBtn table="teams" id={t.id} />
                </div>
                <div className="mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">Dispatcherlar · {ds.length}</div>
                <div className="mt-2 space-y-1.5">
                  {ds.map((d) => <div key={d.id} className="flex items-center gap-2 text-sm"><Avatar name={d.full_name} />{d.full_name}</div>)}
                  {!ds.length && <p className="text-sm text-muted-foreground">—</p>}
                </div>
                <div className="mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">Sürücüler · {dr.length}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dr.map((d) => <span key={d.id} className="rounded-md bg-foreground/5 px-2 py-0.5 text-xs">{d.full_name}</span>)}
                  {!dr.length && <p className="text-sm text-muted-foreground">—</p>}
                </div>
                <Link to="/sohbet" search={{ oda: t.name }} className="mt-4 inline-block text-xs font-medium text-primary hover:underline">Ekip sohbetine git →</Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
