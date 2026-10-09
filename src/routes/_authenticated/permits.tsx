import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/permits")({
  head: () => ({ meta: [{ title: "Permits — HARU TMS" }, { name: "description", content: "Permits in HARU TMS." }, { property: "og:title", content: "Permits — HARU TMS" }, { property: "og:description", content: "Permits in HARU TMS." }] }),
  component: () => (<><PageHeader title="Permits" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
