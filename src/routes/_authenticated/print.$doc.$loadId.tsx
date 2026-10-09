import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/print/$doc/$loadId")({
  head: () => ({ meta: [{ title: "Print Document — HARU TMS" }, { name: "description", content: "Print Document in HARU TMS." }, { property: "og:title", content: "Print Document — HARU TMS" }, { property: "og:description", content: "Print Document in HARU TMS." }] }),
  component: () => (<><PageHeader title="Print Document" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
