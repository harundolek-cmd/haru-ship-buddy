import { createFileRoute } from "@tanstack/react-router";
import { TrucksPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/trucks")({ component: TrucksPage });
