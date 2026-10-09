import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type LoadStatus = Database["public"]["Enums"]["load_status"];
export type DriverStatus = Database["public"]["Enums"]["driver_status"];

// DB enum values are legacy identifiers; labels are the US-facing names.
export const loadStatusOrder: LoadStatus[] = [
  "rezerve",
  "sevk_edildi",
  "yolda",
  "teslim_edildi",
  "invoiced",
  "iptal",
];
export const loadStatusLabel: Record<LoadStatus, string> = {
  rezerve: "Booked",
  sevk_edildi: "Dispatched",
  yolda: "In Transit",
  teslim_edildi: "Delivered",
  invoiced: "Invoiced",
  iptal: "Cancelled",
};
/** CSS variable name of the status color (defined in styles.css). */
export const loadStatusVar: Record<LoadStatus, string> = {
  rezerve: "--st-booked",
  sevk_edildi: "--st-dispatched",
  yolda: "--st-transit",
  teslim_edildi: "--st-delivered",
  invoiced: "--st-invoiced",
  iptal: "--st-cancelled",
};
export const driverStatusLabel: Record<DriverStatus, string> = {
  musait: "Available",
  gorevde: "On Load",
  izinli: "Off Duty",
};
export const driverStatusVar: Record<DriverStatus, string> = {
  musait: "--st-delivered",
  gorevde: "--st-transit",
  izinli: "--st-muted",
};

export const loadNo = (n: number) => `L-${10200 + n}`;

export function useList<T extends keyof Database["public"]["Tables"]>(
  table: T,
  order: string = "created_at",
  ascending = false,
) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order(order, { ascending });
      if (error) throw error;
      return data as unknown as Tables<T>[];
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (key: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: [key] }),
      qc.invalidateQueries({ queryKey: ["business", key] }),
    ]);
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  const q = useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: p }, { data: r }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase
          .from("company_members")
          .select("company_id, companies(*)")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);
      return {
        profile: p,
        isAdmin: (r ?? []).some((x) => x.role === "admin"),
        company: (m?.companies ?? null) as Tables<"companies"> | null,
        companyId: m?.company_id ?? null,
      };
    },
  });
  return {
    user,
    profile: q.data?.profile,
    isAdmin: !!q.data?.isAdmin,
    company: q.data?.company ?? null,
    companyId: q.data?.companyId ?? null,
  };
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function shortName(name?: string | null) {
  if (!name) return "—";
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]![0]}.` : name;
}

export const fmtDate = (d?: string | null) =>
  d
    ? new Date(d + (d.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

export function loadMiles(l: { miles: number | null; distance_km: number | null }) {
  return l.miles ?? (l.distance_km ? Math.round(l.distance_km / 1.609) : null);
}

/** Driver pay for one load given pay settings. */
export function driverPayFor(
  driver: { pay_type: string; pay_rate: number },
  load: { rate: number | null; miles: number | null; distance_km: number | null },
) {
  const gross = Number(load.rate ?? 0);
  if (driver.pay_type === "per_mile") return (loadMiles(load) ?? 0) * Number(driver.pay_rate);
  if (driver.pay_type === "flat") return Number(driver.pay_rate);
  return (gross * Number(driver.pay_rate)) / 100;
}
export const payTypeLabel: Record<string, string> = {
  percent: "% of gross",
  per_mile: "Per mile",
  flat: "Flat per load",
};
