import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type LoadStatus = Database["public"]["Enums"]["load_status"];
export type DriverStatus = Database["public"]["Enums"]["driver_status"];

export const loadStatusLabel: Record<LoadStatus, string> = {
  rezerve: "Rezerve",
  sevk_edildi: "Sevk Edildi",
  yolda: "Yolda",
  teslim_edildi: "Teslim Edildi",
  iptal: "İptal",
};
export const driverStatusLabel: Record<DriverStatus, string> = {
  musait: "Müsait",
  gorevde: "Görevde",
  izinli: "İzinli",
};

export function useList<T extends keyof Database["public"]["Tables"]>(
  table: T,
  order: string = "created_at",
  ascending = false,
) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(order, { ascending });
      if (error) throw error;
      return data as unknown as Tables<T>[];
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (key: string) => qc.invalidateQueries({ queryKey: [key] });
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const profile = useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
      ]);
      return {
        profile: p,
        isAdmin: (r ?? []).some((x) => x.role === "admin"),
      };
    },
  });
  return { user, profile: profile.data?.profile, isAdmin: !!profile.data?.isAdmin };
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toLocaleUpperCase("tr"))
    .join("");
}

export function shortName(name?: string | null) {
  if (!name) return "—";
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : name;
}
