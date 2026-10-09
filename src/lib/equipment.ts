export const equipmentTypes = [
  "RGN", "Stretch RGN", "Double Drop", "Lowboy", "Step Deck", "Flatbed",
  "Conestoga", "Hotshot", "Dry Van", "Reefer", "Power Only",
] as const;

export const axleOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13];

export const truckStatusLabel: Record<string, string> = { active: "Active", shop: "In Shop", inactive: "Inactive" };

export const usStates = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

export const permitTypes = ["Oversize", "Overweight", "OS/OW", "Superload", "Escort / Pilot Car", "Trip & Fuel"];
export const permitStatusLabel: Record<string, string> = { pending: "Pending", active: "Active", expired: "Expired" };

/** Legal limits (federal general guidance): 80,000 lbs gross ≈ 48,000 lbs cargo, 8.5 ft wide, 13.5 ft high on deck, 53 ft long. */
export function isOversize(l: { weight_lbs?: number | null; width_ft?: number | null; height_ft?: number | null; length_ft?: number | null }) {
  return (l.weight_lbs ?? 0) > 48000 || (l.width_ft ?? 0) > 8.5 || (l.height_ft ?? 0) > 8.5 || (l.length_ft ?? 0) > 53;
}

export const usd = (n?: number | null) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
