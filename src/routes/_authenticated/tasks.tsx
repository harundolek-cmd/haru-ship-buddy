import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/components/tms/business/ResourcePages";
export const Route = createFileRoute("/_authenticated/tasks")({ component: TasksPage });
