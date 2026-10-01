import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/tms/ui";
import { ChatRoom } from "@/components/tms/ChatRoom";
import { useList } from "@/lib/tms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sohbet")({
  validateSearch: (s: Record<string, unknown>) => ({ oda: typeof s.oda === "string" ? s.oda : undefined }),
  head: () => ({
    meta: [
      { title: "Sohbet Odası — HARU TMS" },
      { name: "description", content: "Dispatcher ekipleri için anlık sohbet odaları." },
      { property: "og:title", content: "Sohbet Odası — HARU TMS" },
      { property: "og:description", content: "Dispatcher ekipleri için anlık sohbet odaları." },
    ],
  }),
  component: Sohbet,
});

function Sohbet() {
  const { oda } = Route.useSearch();
  const navigate = useNavigate();
  const teams = useList("teams", "name", true).data ?? [];
  const rooms = ["genel", ...teams.map((t) => t.name)];
  const room = oda ?? "genel";

  return (
    <>
      <PageHeader title="Sohbet Odası" subtitle="Canlı ekip iletişimi" />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Panel title="Odalar">
          <div className="p-2">
            {rooms.map((r) => (
              <button
                key={r}
                onClick={() => navigate({ to: "/sohbet", search: { oda: r === "genel" ? undefined : r } })}
                className={cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-foreground/5", room === r && "bg-primary/10 font-medium text-primary")}
              >
                <span className="font-mono">#</span>{r === "genel" ? "Genel" : r}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title={room === "genel" ? "# Genel" : `# ${room}`}>
          <ChatRoom key={room} room={room} />
        </Panel>
      </div>
    </>
  );
}
