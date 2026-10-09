import { createFileRoute } from "@tanstack/react-router";
import { MaintenancePage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/maintenance")({ component: MaintenancePage });
