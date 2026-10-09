import { createFileRoute } from "@tanstack/react-router";
import { StopsPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/stops")({ component: StopsPage });
