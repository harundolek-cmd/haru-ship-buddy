import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/trucks")({
  head: () => ({ meta: [{ title: "Trucks & Trailers — HARU TMS" }, { name: "description", content: "Trucks & Trailers in HARU TMS." }, { property: "og:title", content: "Trucks & Trailers — HARU TMS" }, { property: "og:description", content: "Trucks & Trailers in HARU TMS." }] }),
  component: () => (<><PageHeader title="Trucks & Trailers" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
