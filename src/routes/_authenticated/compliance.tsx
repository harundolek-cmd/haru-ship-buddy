import { createFileRoute } from "@tanstack/react-router";
import { CompliancePage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/compliance")({ component: CompliancePage });
