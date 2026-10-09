import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — HARU TMS" }, { name: "description", content: "Documents in HARU TMS." }, { property: "og:title", content: "Documents — HARU TMS" }, { property: "og:description", content: "Documents in HARU TMS." }] }),
  component: () => (<><PageHeader title="Documents" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
