import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, TableShell, Th, Td, Avatar, Empty } from "@/components/tms/ui";
import { useCurrentUser } from "@/lib/tms";

export const Route = createFileRoute("/_authenticated/yonetici")({
  head: () => ({
    meta: [
      { title: "Yönetici Paneli — HARU TMS" },
      { name: "description", content: "Kullanıcıları ve yetkilerini yönetin." },
      { property: "og:title", content: "Yönetici Paneli — HARU TMS" },
      { property: "og:description", content: "Kullanıcıları ve yetkilerini yönetin." },
    ],
  }),
  component: Yonetici,
});

function Yonetici() {
  const { user, isAdmin } = useCurrentUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("*"),
      ]);
      return (profiles ?? []).map((p) => ({ ...p, admin: (roles ?? []).some((r) => r.user_id === p.id && r.role === "admin") }));
    },
  });

  async function toggle(id: string, makeAdmin: boolean) {
    const { error } = makeAdmin
      ? await supabase.from("user_roles").insert({ user_id: id, role: "admin" })
      : await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
    if (error) { toast.error(error.message); return; }
    toast.success("Yetki güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <>
      <PageHeader title="Yönetici Paneli" subtitle={isAdmin ? "Kullanıcı yetkilerini yönetin" : "Bu sayfadaki değişiklikler yalnızca yöneticilere açıktır"} />
      <Panel title="Kullanıcılar">
        {isLoading ? <Empty text="Yükleniyor…" /> : !data?.length ? <Empty text="Kullanıcı yok." /> : (
          <TableShell head={<><Th>Kullanıcı</Th><Th>Şirket</Th><Th>Rol</Th><Th>Kayıt</Th><Th /></>}>
            {data.map((u) => (
              <tr key={u.id}>
                <Td><span className="flex items-center gap-2.5"><Avatar name={u.full_name} /><span className="font-medium">{u.full_name}</span>{u.id === user?.id && <span className="text-[10px] text-muted-foreground">(siz)</span>}</span></Td>
                <Td className="text-muted-foreground">{u.company_name ?? "—"}</Td>
                <Td><span className={u.admin ? "rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary" : "rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"}>{u.admin ? "Yönetici" : "Dispatcher"}</span></Td>
                <Td className="font-mono text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("tr-TR")}</Td>
                <Td className="text-right">
                  {isAdmin && u.id !== user?.id && (
                    <button onClick={() => toggle(u.id, !u.admin)} className="text-xs font-medium text-primary hover:underline">
                      {u.admin ? "Yöneticiliği kaldır" : "Yönetici yap"}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Panel>
    </>
  );
}
