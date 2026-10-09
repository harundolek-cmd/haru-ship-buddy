import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, shortName, type Tables } from "@/lib/tms";
import { Avatar } from "./ui";
import { cn } from "@/lib/utils";

export function ChatRoom({ room, compact = false }: { room: string; compact?: boolean }) {
  const qc = useQueryClient();
  const { user, profile } = useCurrentUser();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", room],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room", room)
        .order("created_at", { ascending: false })
        .limit(compact ? 6 : 100);
      if (error) throw error;
      return (data as Tables<"messages">[]).reverse();
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`messages-${room}-${compact ? "c" : "f"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room=eq.${room}` }, () =>
        qc.invalidateQueries({ queryKey: ["messages", room] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [room, compact, qc]);

  useEffect(() => {
    if (!compact) bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, compact]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !user) return;
    setText("");
    await supabase.from("messages").insert({
      room,
      content,
      user_id: user.id,
      author_name: profile?.full_name || user.email || "User",
    });
    qc.invalidateQueries({ queryKey: ["messages", room] });
  }

  return (
    <div className={cn("flex flex-col", compact ? "h-full" : "h-[calc(100vh-14rem)]")}>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {messages.length === 0 && <p className="text-center text-[13px] text-muted-foreground">No messages yet. Start the conversation.</p>}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2.5">
            <Avatar name={m.author_name} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{compact ? shortName(m.author_name) : m.author_name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground text-pretty break-words">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="border-t p-3">
        <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm ring-1 ring-foreground/5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="font-mono text-primary" aria-label="Send">↩</button>
        </div>
      </form>
    </div>
  );
}
