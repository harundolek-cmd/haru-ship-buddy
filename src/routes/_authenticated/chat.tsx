import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/tms/ui";
import { ChatRoom } from "@/components/tms/ChatRoom";
import { useList } from "@/lib/tms";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat — HARU TMS" },
      { name: "description", content: "Real-time chat rooms for your dispatch team." },
      { property: "og:title", content: "Chat — HARU TMS" },
      { property: "og:description", content: "Real-time chat rooms for your dispatch team." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const teams = useList("teams", "name", true).data ?? [];
  const rooms = [{ id: "genel", name: "# general" }, ...teams.map((t) => ({ id: `team-${t.id}`, name: `# ${t.name}` }))];
  const [room, setRoom] = useState("genel");
  return (
    <>
      <PageHeader title="Chat" subtitle="Only members of your company can see these rooms" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <Panel title="Rooms">
          <div className="p-2">
            {rooms.map((r) => (
              <button key={r.id} onClick={() => setRoom(r.id)} className={cn("block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted", room === r.id && "bg-primary/10 font-medium text-primary")}>
                {r.name}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title={rooms.find((r) => r.id === room)?.name ?? ""} className="lg:col-span-3">
          <ChatRoom key={room} room={room} />
        </Panel>
      </div>
    </>
  );
}
