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
      add_ons: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      device_stores: {
        Row: {
          created_at: string
          device_id: string
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          assigned_job_types: string[]
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          hourly_rate: number
          id: string
          is_archived: boolean
          phone: string | null
          pin: string
          revenue_center: string
          role: string
          updated_at: string
        }
        Insert: {
          assigned_job_types?: string[]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          hourly_rate?: number
          id?: string
          is_archived?: boolean
          phone?: string | null
          pin?: string
          revenue_center?: string
          role?: string
          updated_at?: string
        }
        Update: {
          assigned_job_types?: string[]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          hourly_rate?: number
          id?: string
          is_archived?: boolean
          phone?: string | null
          pin?: string
          revenue_center?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_feedback: {
        Row: {
          comment: string
          created_at: string
          feedback_date: string
          guest_name: string
          id: string
          platform: string
          sentiment: string
        }
        Insert: {
          comment?: string
          created_at?: string
          feedback_date: string
          guest_name: string
          id?: string
          platform?: string
          sentiment?: string
        }
        Update: {
          comment?: string
          created_at?: string
          feedback_date?: string
          guest_name?: string
          id?: string
          platform?: string
          sentiment?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          allergies: string[] | null
          anniversary: string | null
          avatar_bg: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          initials: string | null
          is_archived: boolean
          loyalty: string | null
          name: string
          notes_allergies: string | null
          notes_general: string | null
          notes_seating_preferences: string | null
          notes_special_note: string | null
          notes_special_relation: string | null
          phone: string | null
          since: string | null
          tags: string[] | null
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          allergies?: string[] | null
          anniversary?: string | null
          avatar_bg?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string | null
          is_archived?: boolean
          loyalty?: string | null
          name: string
          notes_allergies?: string | null
          notes_general?: string | null
          notes_seating_preferences?: string | null
          notes_special_note?: string | null
          notes_special_relation?: string | null
          phone?: string | null
          since?: string | null
          tags?: string[] | null
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          allergies?: string[] | null
          anniversary?: string | null
          avatar_bg?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string | null
          is_archived?: boolean
          loyalty?: string | null
          name?: string
          notes_allergies?: string | null
          notes_general?: string | null
          notes_seating_preferences?: string | null
          notes_special_note?: string | null
          notes_special_relation?: string | null
          phone?: string | null
          since?: string | null
          tags?: string[] | null
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          category_id: string
          id: string
          menu_id: string
          sort_order: number
        }
        Insert: {
          category_id: string
          id?: string
          menu_id: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          id?: string
          menu_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          archived: boolean
          channel_schedules: Json
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          revenue_centers: string[]
          sort_order: number
          updated_at: string
        }
        Insert: {
          archived?: boolean
          channel_schedules?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          revenue_centers?: string[]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          archived?: boolean
          channel_schedules?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          revenue_centers?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          active: boolean
          created_at: string
          id: string
          multi_select: boolean
          name: string
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          multi_select?: boolean
          name: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          multi_select?: boolean
          name?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      modifiers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_default: boolean
          modifier_group_id: string
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          modifier_group_id: string
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          modifier_group_id?: string
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          bullets: Json
          category: string
          created_at: string
          footer: string | null
          has_update: boolean
          headline: string
          id: string
          is_read: boolean
          preview: string
          time: string
          title: string
          version: string
          version_date: string
        }
        Insert: {
          body?: string
          bullets?: Json
          category?: string
          created_at?: string
          footer?: string | null
          has_update?: boolean
          headline?: string
          id?: string
          is_read?: boolean
          preview?: string
          time?: string
          title: string
          version?: string
          version_date?: string
        }
        Update: {
          body?: string
          bullets?: Json
          category?: string
          created_at?: string
          footer?: string | null
          has_update?: boolean
          headline?: string
          id?: string
          is_read?: boolean
          preview?: string
          time?: string
          title?: string
          version?: string
          version_date?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          category: string
          id: string
          item_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          category?: string
          id?: string
          item_name: string
          order_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          category?: string
          id?: string
          item_name?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string | null
          discount_amount: number
          employee_name: string | null
          id: string
          order_number: number
          order_type: string
          payment_type: string
          platform: string | null
          refund_amount: number
          status: string
          subtotal: number
          tax_amount: number
          tip_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          discount_amount?: number
          employee_name?: string | null
          id?: string
          order_number?: number
          order_type?: string
          payment_type?: string
          platform?: string | null
          refund_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          tip_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          discount_amount?: number
          employee_name?: string | null
          id?: string
          order_number?: number
          order_type?: string
          payment_type?: string
          platform?: string | null
          refund_amount?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          tip_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_add_ons: {
        Row: {
          add_on_id: string
          id: string
          product_id: string
        }
        Insert: {
          add_on_id: string
          id?: string
          product_id: string
        }
        Update: {
          add_on_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_add_ons_add_on_id_fkey"
            columns: ["add_on_id"]
            isOneToOne: false
            referencedRelation: "add_ons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_add_ons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_groups: {
        Row: {
          id: string
          modifier_group_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          modifier_group_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          modifier_group_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          archived: boolean
          category_id: string
          created_at: string
          delivery: boolean
          description: string | null
          dine_in: boolean
          id: string
          image_url: string | null
          inventory_tracking: boolean
          max_price: number | null
          min_price: number | null
          name: string
          negative_inventory: boolean
          out_of_stock: boolean
          popular: boolean
          price: number
          price_type: string
          sku: string | null
          sort_order: number
          takeaway: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          archived?: boolean
          category_id: string
          created_at?: string
          delivery?: boolean
          description?: string | null
          dine_in?: boolean
          id?: string
          image_url?: string | null
          inventory_tracking?: boolean
          max_price?: number | null
          min_price?: number | null
          name: string
          negative_inventory?: boolean
          out_of_stock?: boolean
          popular?: boolean
          price?: number
          price_type?: string
          sku?: string | null
          sort_order?: number
          takeaway?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          archived?: boolean
          category_id?: string
          created_at?: string
          delivery?: boolean
          description?: string | null
          dine_in?: boolean
          id?: string
          image_url?: string | null
          inventory_tracking?: boolean
          max_price?: number | null
          min_price?: number | null
          name?: string
          negative_inventory?: boolean
          out_of_stock?: boolean
          popular?: boolean
          price?: number
          price_type?: string
          sku?: string | null
          sort_order?: number
          takeaway?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          color_category: string | null
          created_at: string
          end_time: string | null
          guest_name: string
          id: string
          location: string | null
          no_show: boolean
          party_size: number
          reservation_date: string
          start_time: string
          status: string
          title: string | null
          total_spent: number
          updated_at: string
        }
        Insert: {
          color_category?: string | null
          created_at?: string
          end_time?: string | null
          guest_name: string
          id?: string
          location?: string | null
          no_show?: boolean
          party_size?: number
          reservation_date: string
          start_time?: string
          status?: string
          title?: string | null
          total_spent?: number
          updated_at?: string
        }
        Update: {
          color_category?: string | null
          created_at?: string
          end_time?: string | null
          guest_name?: string
          id?: string
          location?: string | null
          no_show?: boolean
          party_size?: number
          reservation_date?: string
          start_time?: string
          status?: string
          title?: string | null
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          active: boolean
          address: string
          created_at: string
          email: string | null
          id: string
          location: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          location?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          location?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          device_id: string
          id: string
          preference_key: string
          preference_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          preference_key: string
          preference_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          preference_key?: string
          preference_value?: string
          updated_at?: string
        }
        Relationships: []
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
