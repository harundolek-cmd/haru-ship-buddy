import { createFileRoute } from "@tanstack/react-router";
import { PermitsPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/permits")({ component: PermitsPage });
