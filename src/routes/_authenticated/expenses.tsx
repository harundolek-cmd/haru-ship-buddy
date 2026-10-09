import { createFileRoute } from "@tanstack/react-router";
import { ExpensesPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/expenses")({ component: ExpensesPage });
