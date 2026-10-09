export const equipmentTypes = [
  "RGN", "Double Drop", "Lowboy", "Step Deck", "Flatbed", "Conestoga",
  "Hotshot", "Dry Van", "Reefer", "Power Only", "Stretch RGN", "Removable Gooseneck",
] as const;

export const axleOptions = [3, 5, 6, 7, 8, 9, 10, 13];

export const truckStatusLabel: Record<string, string> = {
  active: "Aktif",
  shop: "Serviste",
  inactive: "Pasif",
};

/** US legal limits — anything above needs oversize/overweight permits. */
export function isOversize(l: { weight_lbs?: number | null; width_ft?: number | null; height_ft?: number | null; length_ft?: number | null }) {
  return (l.weight_lbs ?? 0) > 48000 || (l.width_ft ?? 0) > 8.5 || (l.height_ft ?? 0) > 8.5 || (l.length_ft ?? 0) > 53;
}

export const usd = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
