import { createFileRoute } from "@tanstack/react-router";
import { QuotesPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/quotes")({ component: QuotesPage });
