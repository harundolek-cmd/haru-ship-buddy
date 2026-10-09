import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/tms/ui";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Company & Users — HARU TMS" }, { name: "description", content: "Company & Users in HARU TMS." }, { property: "og:title", content: "Company & Users — HARU TMS" }, { property: "og:description", content: "Company & Users in HARU TMS." }] }),
  component: () => (<><PageHeader title="Company & Users" /><Panel><Empty text="This page is not finished yet." /></Panel></>),
});
