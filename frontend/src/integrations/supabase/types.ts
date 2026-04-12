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
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          priority: string | null
          target_group_id: string | null
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          priority?: string | null
          target_group_id?: string | null
          target_user_id?: string | null
          title: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          priority?: string | null
          target_group_id?: string | null
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      devotional_likes: {
        Row: {
          created_at: string
          devotional_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          devotional_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          devotional_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_likes_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
        ]
      }
      devotionals: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          expiration_date: string | null
          id: string
          is_active: boolean
          is_video_upload: boolean | null
          media_url: string | null
          publish_date: string
          status: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          is_video_upload?: boolean | null
          media_url?: string | null
          publish_date?: string
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          is_video_upload?: boolean | null
          media_url?: string | null
          publish_date?: string
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          payment_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          payment_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          payment_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reports: {
        Row: {
          children_count: number | null
          created_at: string
          created_by: string | null
          event_id: string | null
          group_id: string | null
          id: string
          monitors_count: number | null
          notes: string | null
          public_count: number | null
          report_date: string
          report_type: string
          tithers: Json | null
          tithes_amount: number | null
          total_attendees: number | null
          total_offerings: number | null
          updated_at: string
          youth_count: number | null
        }
        Insert: {
          children_count?: number | null
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          monitors_count?: number | null
          notes?: string | null
          public_count?: number | null
          report_date?: string
          report_type?: string
          tithers?: Json | null
          tithes_amount?: number | null
          total_attendees?: number | null
          total_offerings?: number | null
          updated_at?: string
          youth_count?: number | null
        }
        Update: {
          children_count?: number | null
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          group_id?: string | null
          id?: string
          monitors_count?: number | null
          notes?: string | null
          public_count?: number | null
          report_date?: string
          report_type?: string
          tithers?: Json | null
          tithes_amount?: number | null
          total_attendees?: number | null
          total_offerings?: number | null
          updated_at?: string
          youth_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_type: string
          group_id: string | null
          id: string
          is_general: boolean
          location: string | null
          map_url: string | null
          pix_key: string | null
          pix_qrcode_url: string | null
          price: number | null
          speakers: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_type?: string
          group_id?: string | null
          id?: string
          is_general?: boolean
          location?: string | null
          map_url?: string | null
          pix_key?: string | null
          pix_qrcode_url?: string | null
          price?: number | null
          speakers?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          group_id?: string | null
          id?: string
          is_general?: boolean
          location?: string | null
          map_url?: string | null
          pix_key?: string | null
          pix_qrcode_url?: string | null
          price?: number | null
          speakers?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_routines: {
        Row: {
          group_id: string | null
          id: string
          is_enabled: boolean | null
          routine_key: string
          updated_at: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          is_enabled?: boolean | null
          routine_key: string
          updated_at?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          is_enabled?: boolean | null
          routine_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_routines_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hidden_conversations: {
        Row: {
          group_id: string | null
          hidden_at: string
          id: string
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          group_id?: string | null
          hidden_at?: string
          id?: string
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          group_id?: string | null
          hidden_at?: string
          id?: string
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_checkins: {
        Row: {
          call_requested: boolean | null
          category: string | null
          child_name: string
          created_at: string | null
          event_id: string | null
          guardian_id: string | null
          id: string
          items_description: string | null
          status: string | null
          updated_at: string | null
          validation_token: string
        }
        Insert: {
          call_requested?: boolean | null
          category?: string | null
          child_name: string
          created_at?: string | null
          event_id?: string | null
          guardian_id?: string | null
          id?: string
          items_description?: string | null
          status?: string | null
          updated_at?: string | null
          validation_token: string
        }
        Update: {
          call_requested?: boolean | null
          category?: string | null
          child_name?: string
          created_at?: string | null
          event_id?: string | null
          guardian_id?: string | null
          id?: string
          items_description?: string | null
          status?: string | null
          updated_at?: string | null
          validation_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          url?: string
        }
        Relationships: []
      }
      landing_testimonials: {
        Row: {
          created_at: string | null
          id: string
          name: string
          role: string | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          role?: string | null
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          role?: string | null
          text?: string
        }
        Relationships: []
      }
      member_groups: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          group_id: string | null
          id: string
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          group_id: string | null
          id: string
          role_function: string
          schedule_date: string
          updated_at: string
          volunteer_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          id?: string
          role_function: string
          schedule_date: string
          updated_at?: string
          volunteer_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_id?: string | null
          id?: string
          role_function?: string
          schedule_date?: string
          updated_at?: string
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_schedules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_schedules_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "volunteers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteers: {
        Row: {
          availability: string | null
          created_at: string
          full_name: string
          id: string
          interest_area: string | null
          interest_areas: string[] | null
          phone: string | null
          status: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          full_name: string
          id?: string
          interest_area?: string | null
          interest_areas?: string[] | null
          phone?: string | null
          status?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          full_name?: string
          id?: string
          interest_area?: string | null
          interest_areas?: string[] | null
          phone?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_manage_user: {
        Args: {
          email: string
          password?: string
          raw_user_meta_data?: Json
          target_user_id?: string
        }
        Returns: string
      }
      admin_remove_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { role_name: string; user_id: string }; Returns: boolean }
        | { Args: { role_name: string; user_id: string }; Returns: boolean }
      is_admin_master: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "pastor" | "membro" | "visitante" | "gerente"
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
      app_role: ["admin", "pastor", "membro", "visitante", "gerente"],
    },
  },
} as const
