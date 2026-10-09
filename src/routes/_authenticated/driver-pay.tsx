import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/driver-pay")({
  head: () => ({ meta: [{ title: "Driver Pay — HARU TMS" }, { name: "description", content: "Driver Pay in HARU TMS." }, { property: "og:title", content: "Driver Pay — HARU TMS" }, { property: "og:description", content: "Driver Pay in HARU TMS." }] }),
  component: () => (<><PageHeader title="Driver Pay" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
