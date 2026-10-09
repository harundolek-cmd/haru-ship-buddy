export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          created_at: string
          dot_number: string | null
          email: string | null
          id: string
          mc_number: string | null
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          dot_number?: string | null
          email?: string | null
          id?: string
          mc_number?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          dot_number?: string | null
          email?: string | null
          id?: string
          mc_number?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatchers: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          team_id: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          team_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatchers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatchers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_name: string
          file_path: string
          id: string
          load_id: string
          uploaded_by: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_name: string
          file_path: string
          id?: string
          load_id: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_name?: string
          file_path?: string
          id?: string
          load_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cdl_class: string | null
          company_id: string
          created_at: string
          current_city: string | null
          full_name: string
          home_base: string | null
          id: string
          lat: number | null
          license_no: string | null
          lng: number | null
          location_updated_at: string | null
          pay_rate: number
          pay_type: string
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"]
          team_id: string | null
          truck_plate: string | null
        }
        Insert: {
          cdl_class?: string | null
          company_id?: string
          created_at?: string
          current_city?: string | null
          full_name: string
          home_base?: string | null
          id?: string
          lat?: number | null
          license_no?: string | null
          lng?: number | null
          location_updated_at?: string | null
          pay_rate?: number
          pay_type?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          team_id?: string | null
          truck_plate?: string | null
        }
        Update: {
          cdl_class?: string | null
          company_id?: string
          created_at?: string
          current_city?: string | null
          full_name?: string
          home_base?: string | null
          id?: string
          lat?: number | null
          license_no?: string | null
          lng?: number | null
          location_updated_at?: string | null
          pay_rate?: number
          pay_type?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"]
          team_id?: string | null
          truck_plate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          broker: string | null
          broker_mc: string | null
          commodity: string | null
          company_id: string
          consignee: string | null
          created_at: string
          delivery_date: string | null
          destination: string
          detention: number | null
          dispatcher_id: string | null
          distance_km: number | null
          driver_id: string | null
          equipment_type: string | null
          height_ft: number | null
          id: string
          length_ft: number | null
          load_no: number
          lumper: number | null
          miles: number | null
          notes: string | null
          origin: string
          oversize: boolean
          permits: string | null
          pickup_date: string | null
          pieces: number | null
          rate: number | null
          reference_no: string | null
          route_id: string | null
          shipper: string | null
          status: Database["public"]["Enums"]["load_status"]
          truck_id: string | null
          weight_lbs: number | null
          width_ft: number | null
        }
        Insert: {
          broker?: string | null
          broker_mc?: string | null
          commodity?: string | null
          company_id?: string
          consignee?: string | null
          created_at?: string
          delivery_date?: string | null
          destination: string
          detention?: number | null
          dispatcher_id?: string | null
          distance_km?: number | null
          driver_id?: string | null
          equipment_type?: string | null
          height_ft?: number | null
          id?: string
          length_ft?: number | null
          load_no?: number
          lumper?: number | null
          miles?: number | null
          notes?: string | null
          origin: string
          oversize?: boolean
          permits?: string | null
          pickup_date?: string | null
          pieces?: number | null
          rate?: number | null
          reference_no?: string | null
          route_id?: string | null
          shipper?: string | null
          status?: Database["public"]["Enums"]["load_status"]
          truck_id?: string | null
          weight_lbs?: number | null
          width_ft?: number | null
        }
        Update: {
          broker?: string | null
          broker_mc?: string | null
          commodity?: string | null
          company_id?: string
          consignee?: string | null
          created_at?: string
          delivery_date?: string | null
          destination?: string
          detention?: number | null
          dispatcher_id?: string | null
          distance_km?: number | null
          driver_id?: string | null
          equipment_type?: string | null
          height_ft?: number | null
          id?: string
          length_ft?: number | null
          load_no?: number
          lumper?: number | null
          miles?: number | null
          notes?: string | null
          origin?: string
          oversize?: boolean
          permits?: string | null
          pickup_date?: string | null
          pieces?: number | null
          rate?: number | null
          reference_no?: string | null
          route_id?: string | null
          shipper?: string | null
          status?: Database["public"]["Enums"]["load_status"]
          truck_id?: string | null
          weight_lbs?: number | null
          width_ft?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_name: string
          company_id: string
          content: string
          created_at: string
          id: string
          room: string
          user_id: string
        }
        Insert: {
          author_name: string
          company_id?: string
          content: string
          created_at?: string
          id?: string
          room?: string
          user_id: string
        }
        Update: {
          author_name?: string
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          room?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          company_id: string
          cost: number | null
          created_at: string
          expiry_date: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          load_id: string | null
          notes: string | null
          permit_no: string | null
          permit_type: string
          state: string
          status: string
        }
        Insert: {
          company_id?: string
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          load_id?: string | null
          notes?: string | null
          permit_no?: string | null
          permit_type?: string
          state: string
          status?: string
        }
        Update: {
          company_id?: string
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          load_id?: string | null
          notes?: string | null
          permit_no?: string | null
          permit_type?: string
          state?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "permits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permits_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      routes: {
        Row: {
          company_id: string
          created_at: string
          destination: string
          distance_km: number | null
          id: string
          name: string
          notes: string | null
          origin: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          destination: string
          distance_km?: number | null
          id?: string
          name: string
          notes?: string | null
          origin: string
        }
        Update: {
          company_id?: string
          created_at?: string
          destination?: string
          distance_km?: number | null
          id?: string
          name?: string
          notes?: string | null
          origin?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          company_id: string
          created_at: string
          deductions: number
          details: Json | null
          driver_id: string | null
          driver_pay: number
          gross: number
          id: string
          net: number
          notes: string | null
          period_end: string | null
          period_start: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          deductions?: number
          details?: Json | null
          driver_id?: string | null
          driver_pay?: number
          gross?: number
          id?: string
          net?: number
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          deductions?: number
          details?: Json | null
          driver_id?: string | null
          driver_pay?: number
          gross?: number
          id?: string
          net?: number
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          region: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          axles: number | null
          company_id: string
          created_at: string
          deck_length_ft: number | null
          driver_id: string | null
          equipment_type: string
          id: string
          make: string | null
          max_weight_lbs: number | null
          model_year: number | null
          plate: string | null
          plate_state: string | null
          status: string
          unit_no: string
          vin: string | null
        }
        Insert: {
          axles?: number | null
          company_id?: string
          created_at?: string
          deck_length_ft?: number | null
          driver_id?: string | null
          equipment_type?: string
          id?: string
          make?: string | null
          max_weight_lbs?: number | null
          model_year?: number | null
          plate?: string | null
          plate_state?: string | null
          status?: string
          unit_no: string
          vin?: string | null
        }
        Update: {
          axles?: number | null
          company_id?: string
          created_at?: string
          deck_length_ft?: number | null
          driver_id?: string | null
          equipment_type?: string
          id?: string
          make?: string | null
          max_weight_lbs?: number | null
          model_year?: number | null
          plate?: string | null
          plate_state?: string | null
          status?: string
          unit_no?: string
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trucks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trucks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dispatcher"
      doc_type: "BOL" | "POD"
      driver_status: "musait" | "gorevde" | "izinli"
      load_status:
        | "rezerve"
        | "sevk_edildi"
        | "yolda"
        | "teslim_edildi"
        | "iptal"
        | "invoiced"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "dispatcher"],
      doc_type: ["BOL", "POD"],
      driver_status: ["musait", "gorevde", "izinli"],
      load_status: [
        "rezerve",
        "sevk_edildi",
        "yolda",
        "teslim_edildi",
        "iptal",
        "invoiced",
      ],
    },
  },
} as const
