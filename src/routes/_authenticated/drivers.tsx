import { createFileRoute } from "@tanstack/react-router";
import { DriversPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/drivers")({ component: DriversPage });
