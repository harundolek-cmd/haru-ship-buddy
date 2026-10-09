import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
type Table<R> = { Row: R; Insert: Partial<R>; Update: Partial<R>; Relationships: [] };
type Base = { id: string; company_id: string; created_at: string };
export type BusinessRows = {
  partners: Base & {
    name: string;
    kind: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    mc_number: string | null;
    dot_number: string | null;
    address: string | null;
    payment_terms: number;
    credit_limit: number;
    status: string;
    notes: string | null;
  };
  quotes: Base & {
    quote_no: string;
    partner_id: string | null;
    origin: string;
    destination: string;
    equipment_type: string;
    miles: number | null;
    amount: number;
    valid_until: string | null;
    status: string;
    load_id: string | null;
    notes: string | null;
  };
  invoices: Base & {
    invoice_no: string;
    load_id: string | null;
    customer_name: string;
    issue_date: string;
    due_date: string;
    total: number;
    paid_amount: number;
    status: string;
    notes: string | null;
  };
  invoice_payments: Base & {
    invoice_id: string;
    amount: number;
    paid_on: string;
    reference: string | null;
    method: string;
    request_id: string;
  };
  expenses: Base & {
    load_id: string | null;
    truck_id: string | null;
    expense_date: string;
    category: string;
    vendor: string | null;
    amount: number;
    reference: string | null;
    notes: string | null;
  };
  maintenance: Base & {
    truck_id: string;
    service: string;
    due_date: string;
    due_odometer: number | null;
    status: string;
    completed_date: string | null;
    vendor: string | null;
    cost: number;
    notes: string | null;
  };
  operations_tasks: Base & {
    title: string;
    load_id: string | null;
    assignee: string | null;
    due_date: string | null;
    priority: string;
    status: string;
    notes: string | null;
  };
  load_stops: Base & {
    load_id: string;
    sequence: number;
    kind: string;
    facility: string | null;
    address: string;
    appointment_at: string | null;
    arrived_at: string | null;
    departed_at: string | null;
    contact: string | null;
    reference: string | null;
    notes: string | null;
  };
  compliance_records: Base & {
    driver_id: string | null;
    truck_id: string | null;
    document_type: string;
    reference: string | null;
    expiry_date: string;
    notes: string | null;
  };
  settlement_loads: Base & {
    settlement_id: string;
    load_id: string;
  };
};
export type BusinessDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & { [K in keyof BusinessRows]: Table<BusinessRows[K]> };
    Functions: Database["public"]["Functions"] & {
      record_invoice_payment: {
        Args: {
          p_invoice: string;
          p_amount: number;
          p_date: string;
          p_method: string;
          p_reference: string;
          p_request: string;
        };
        Returns: string;
      };
      convert_quote: { Args: { p_quote: string }; Returns: string };
      create_driver_settlement: {
        Args: {
          p_driver: string;
          p_start: string;
          p_end: string;
          p_deductions: number;
          p_notes: string;
        };
        Returns: string;
      };
    };
  };
};
// The same authenticated browser client; no extra session or elevated credentials.
export const businessDb = supabase as unknown as SupabaseClient<BusinessDatabase>;
export type ResourceName =
  keyof BusinessRows | "loads" | "drivers" | "trucks" | "permits" | "settlements";
// Uniform adapter for schema-driven forms. Only allowlisted company resources are exposed;
// field definitions validate writes, and database constraints/RLS remain authoritative.
type ResourceRow = { id: string; company_id: string; created_at: string; [key: string]: unknown };
type FormDatabase = {
  public: {
    Tables: {
      [K in ResourceName]: {
        Row: ResourceRow;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
export const resourceDb = businessDb as unknown as SupabaseClient<FormDatabase>;
