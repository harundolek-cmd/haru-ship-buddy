import { createFileRoute } from "@tanstack/react-router";
import { PartnersPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/partners")({ component: PartnersPage });
