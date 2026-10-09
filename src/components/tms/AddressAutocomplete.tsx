import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type AddressAutocompleteProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  onChange: (value: string) => void;
  business?: boolean;
};

type GooglePlace = { name?: string; formatted_address?: string };
type GoogleAutocomplete = {
  addListener: (event: string, callback: () => void) => { remove: () => void };
  getPlace: () => GooglePlace | undefined;
};
type GoogleMapsApi = {
  maps?: { places?: { Autocomplete: new (input: HTMLInputElement, options: Record<string, unknown>) => GoogleAutocomplete } };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __haruGoogleMapsPromise?: Promise<void>;
  }
}

function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || typeof window === "undefined") return Promise.reject(new Error("Google Maps key is not configured"));
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__haruGoogleMapsPromise) return window.__haruGoogleMapsPromise;
  window.__haruGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not load"));
    document.head.appendChild(script);
  });
  return window.__haruGoogleMapsPromise;
}

export function AddressAutocomplete({ onChange, business = false, value, ...props }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef<(value: string) => void>(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let autocomplete: GoogleAutocomplete | undefined;
    let listener: { remove: () => void } | undefined;
    loadGoogleMaps()
      .then(() => {
        if (!inputRef.current || !window.google?.maps?.places) return;
        autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "us" },
          fields: ["name", "formatted_address", "address_components", "geometry"],
          types: business ? ["establishment"] : ["address"],
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const next = business
            ? [place?.name, place?.formatted_address].filter(Boolean).join(" — ")
            : place?.formatted_address || place?.name || "";
          if (next) onChangeRef.current(next);
        });
      })
      .catch(() => undefined);
    return () => listener?.remove();
  }, [business]);

  return <Input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} {...props} />;
}
