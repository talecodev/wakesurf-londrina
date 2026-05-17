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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      board_messages: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          created_at: string
          id: string
          image_url: string
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      google_integrations: {
        Row: {
          access_token: string
          created_at: string
          google_email: string
          id: string
          is_owner: boolean
          profile_id: string | null
          refresh_token: string
          token_expiration: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          google_email: string
          id?: string
          is_owner?: boolean
          profile_id?: string | null
          refresh_token: string
          token_expiration: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          google_email?: string
          id?: string
          is_owner?: boolean
          profile_id?: string | null
          refresh_token?: string
          token_expiration?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          paid_at: string | null
          session_id: string
          status: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          paid_at?: string | null
          session_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          paid_at?: string | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contraindicacoes: string | null
          created_at: string
          id: string
          idade: number | null
          nome: string
          peso: number | null
          sexo: string | null
          telefone: string
        }
        Insert: {
          contraindicacoes?: string | null
          created_at?: string
          id?: string
          idade?: number | null
          nome: string
          peso?: number | null
          sexo?: string | null
          telefone: string
        }
        Update: {
          contraindicacoes?: string | null
          created_at?: string
          id?: string
          idade?: number | null
          nome?: string
          peso?: number | null
          sexo?: string | null
          telefone?: string
        }
        Relationships: []
      }
      rider_profiles: {
        Row: {
          created_at: string
          id: string
          nickname: string
          profile_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname: string
          profile_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          last_sync_at: string | null
          profile_id: string
          session_date: string
          session_time: string
          status: string
        }
        Insert: {
          created_at?: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          last_sync_at?: string | null
          profile_id: string
          session_date: string
          session_time: string
          status?: string
        }
        Update: {
          created_at?: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          last_sync_at?: string | null
          profile_id?: string
          session_date?: string
          session_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      confirm_payment: {
        Args: { _payment_id: string; _session_id: string }
        Returns: undefined
      }
      create_booking: {
        Args: {
          _contraindicacoes: string
          _idade: number
          _nome: string
          _peso: number
          _session_date: string
          _session_time: string
          _sexo: string
          _telefone: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
