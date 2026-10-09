import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/drivers")({
  head: () => ({ meta: [{ title: "Drivers — HARU TMS" }, { name: "description", content: "Drivers in HARU TMS." }, { property: "og:title", content: "Drivers — HARU TMS" }, { property: "og:description", content: "Drivers in HARU TMS." }] }),
  component: () => (<><PageHeader title="Drivers" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
