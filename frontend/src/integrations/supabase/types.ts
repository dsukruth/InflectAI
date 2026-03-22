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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          badge_type: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          badge_type: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          badge_type?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          created_at: string
          id: string
          snapshot_date: string
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot_date?: string
          total_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snapshot_date?: string
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          avg_cost_basis: number
          created_at: string
          id: string
          quantity: number
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost_basis: number
          created_at?: string
          id?: string
          quantity: number
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost_basis?: number
          created_at?: string
          id?: string
          quantity?: number
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          buying_power: number
          created_at: string
          default_mode: string
          display_name: string | null
          email: string | null
          id: string
          queries_today: number
        }
        Insert: {
          buying_power?: number
          created_at?: string
          default_mode?: string
          display_name?: string | null
          email?: string | null
          id: string
          queries_today?: number
        }
        Update: {
          buying_power?: number
          created_at?: string
          default_mode?: string
          display_name?: string | null
          email?: string | null
          id?: string
          queries_today?: number
        }
        Relationships: []
      }
      queries: {
        Row: {
          created_at: string
          id: string
          intent_type: string | null
          mode: string
          response_text: string | null
          session_id: string | null
          ticker: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intent_type?: string | null
          mode: string
          response_text?: string | null
          session_id?: string | null
          ticker?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intent_type?: string | null
          mode?: string
          response_text?: string | null
          session_id?: string | null
          ticker?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string
          fill_price: number
          id: string
          quantity: number
          side: string
          status: string
          ticker: string
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          fill_price: number
          id?: string
          quantity: number
          side: string
          status?: string
          ticker: string
          total_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          fill_price?: number
          id?: string
          quantity?: number
          side?: string
          status?: string
          ticker?: string
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
