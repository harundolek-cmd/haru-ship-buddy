import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({ meta: [{ title: "Live Map — HARU TMS" }, { name: "description", content: "Live Map in HARU TMS." }, { property: "og:title", content: "Live Map — HARU TMS" }, { property: "og:description", content: "Live Map in HARU TMS." }] }),
  component: () => (<><PageHeader title="Live Map" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
