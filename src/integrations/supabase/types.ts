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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: unknown
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
        }
        Relationships: []
      }
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
      brand_integrations: {
        Row: {
          brand_id: string
          config: Json | null
          configured: boolean
          created_at: string
          enabled: boolean
          id: string
          integration_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          config?: Json | null
          configured?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          integration_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          config?: Json | null
          configured?: boolean
          created_at?: string
          enabled?: boolean
          id?: string
          integration_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_integrations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_integrations_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_sub_verticals: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          sub_vertical_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          sub_vertical_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          sub_vertical_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_sub_verticals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_sub_verticals_sub_vertical_id_fkey"
            columns: ["sub_vertical_id"]
            isOneToOne: false
            referencedRelation: "sub_verticals"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_verticals: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          vertical_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          vertical_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          vertical_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_verticals_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_verticals_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "verticals"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          accent_color: string | null
          billing_owner: string
          brand_markup: number | null
          brand_type: string
          can_have_resellers: boolean
          can_sell_plans: Database["public"]["Enums"]["plan_tier"][] | null
          created_at: string
          default_plan_id: string | null
          favicon: string | null
          id: string
          logo_dark: string | null
          logo_light: string | null
          merchant_count: number
          mrr: number
          name: string
          primary_domain: string | null
          reseller_count: number
          reseller_permissions: Json | null
          slug: string
          status: Database["public"]["Enums"]["brand_status"]
          subdomain: string | null
          theme_mode: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accent_color?: string | null
          billing_owner?: string
          brand_markup?: number | null
          brand_type?: string
          can_have_resellers?: boolean
          can_sell_plans?: Database["public"]["Enums"]["plan_tier"][] | null
          created_at?: string
          default_plan_id?: string | null
          favicon?: string | null
          id?: string
          logo_dark?: string | null
          logo_light?: string | null
          merchant_count?: number
          mrr?: number
          name: string
          primary_domain?: string | null
          reseller_count?: number
          reseller_permissions?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["brand_status"]
          subdomain?: string | null
          theme_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accent_color?: string | null
          billing_owner?: string
          brand_markup?: number | null
          brand_type?: string
          can_have_resellers?: boolean
          can_sell_plans?: Database["public"]["Enums"]["plan_tier"][] | null
          created_at?: string
          default_plan_id?: string | null
          favicon?: string | null
          id?: string
          logo_dark?: string | null
          logo_light?: string | null
          merchant_count?: number
          mrr?: number
          name?: string
          primary_domain?: string | null
          reseller_count?: number
          reseller_permissions?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["brand_status"]
          subdomain?: string | null
          theme_mode?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_default_plan_id_fkey"
            columns: ["default_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_drawer_sessions: {
        Row: {
          cash_refunds: number
          cash_sales: number
          closed_at: string | null
          closing_cash: number | null
          created_at: string
          device_id: string
          difference: number
          drawer_name: string
          expected_in_drawer: number
          id: string
          merchant_id: string | null
          opened_at: string
          starting_cash: number
          status: string
          updated_at: string
        }
        Insert: {
          cash_refunds?: number
          cash_sales?: number
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          device_id: string
          difference?: number
          drawer_name: string
          expected_in_drawer?: number
          id?: string
          merchant_id?: string | null
          opened_at?: string
          starting_cash?: number
          status?: string
          updated_at?: string
        }
        Update: {
          cash_refunds?: number
          cash_sales?: number
          closed_at?: string | null
          closing_cash?: number | null
          created_at?: string
          device_id?: string
          difference?: number
          drawer_name?: string
          expected_in_drawer?: number
          id?: string
          merchant_id?: string | null
          opened_at?: string
          starting_cash?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_drawer_sessions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_transactions: {
        Row: {
          amount: number
          created_at: string
          device_id: string
          employee_name: string | null
          id: string
          note: string | null
          reason: string
          session_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          device_id: string
          employee_name?: string | null
          id?: string
          note?: string | null
          reason: string
          session_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          device_id?: string
          employee_name?: string | null
          id?: string
          note?: string | null
          reason?: string
          session_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_drawer_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          merchant_id: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          merchant_id?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          merchant_id?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_options: {
        Row: {
          auto_close_ticket: boolean
          created_at: string
          device_id: string
          email_receipt: boolean
          enable_hold_fire: boolean
          enable_payment_sounds: boolean
          enable_quick_amounts: boolean
          enable_tips: boolean
          guest_notes_enabled: boolean
          id: string
          print_receipt: boolean
          qr_bill_payment: boolean
          require_guest_name: boolean
          require_order_type: boolean
          show_itemized_tax: boolean
          show_order_summary: boolean
          show_save_button: boolean
          signature_threshold: number
          skip_signature: boolean
          skip_tip_screen: boolean
          sms_receipt: boolean
          split_check: boolean
          updated_at: string
        }
        Insert: {
          auto_close_ticket?: boolean
          created_at?: string
          device_id: string
          email_receipt?: boolean
          enable_hold_fire?: boolean
          enable_payment_sounds?: boolean
          enable_quick_amounts?: boolean
          enable_tips?: boolean
          guest_notes_enabled?: boolean
          id?: string
          print_receipt?: boolean
          qr_bill_payment?: boolean
          require_guest_name?: boolean
          require_order_type?: boolean
          show_itemized_tax?: boolean
          show_order_summary?: boolean
          show_save_button?: boolean
          signature_threshold?: number
          skip_signature?: boolean
          skip_tip_screen?: boolean
          sms_receipt?: boolean
          split_check?: boolean
          updated_at?: string
        }
        Update: {
          auto_close_ticket?: boolean
          created_at?: string
          device_id?: string
          email_receipt?: boolean
          enable_hold_fire?: boolean
          enable_payment_sounds?: boolean
          enable_quick_amounts?: boolean
          enable_tips?: boolean
          guest_notes_enabled?: boolean
          id?: string
          print_receipt?: boolean
          qr_bill_payment?: boolean
          require_guest_name?: boolean
          require_order_type?: boolean
          show_itemized_tax?: boolean
          show_order_summary?: boolean
          show_save_button?: boolean
          signature_threshold?: number
          skip_signature?: boolean
          skip_tip_screen?: boolean
          sms_receipt?: boolean
          split_check?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      default_modifiers: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
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
      discounts: {
        Row: {
          amount: number
          applicable_products: Json | null
          applicable_to: string | null
          archived: boolean
          created_at: string
          device_id: string
          id: string
          merchant_id: string | null
          name: string
          requires_manager_pin: boolean
          schedule_enabled: boolean
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          applicable_products?: Json | null
          applicable_to?: string | null
          archived?: boolean
          created_at?: string
          device_id: string
          id?: string
          merchant_id?: string | null
          name: string
          requires_manager_pin?: boolean
          schedule_enabled?: boolean
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          applicable_products?: Json | null
          applicable_to?: string | null
          archived?: boolean
          created_at?: string
          device_id?: string
          id?: string
          merchant_id?: string | null
          name?: string
          requires_manager_pin?: boolean
          schedule_enabled?: boolean
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_shifts: {
        Row: {
          allow_overtime: boolean
          assign_section: string | null
          break_minutes: number
          clock_in: string | null
          clock_out: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          end_time: string | null
          id: string
          job_type: string | null
          pay_rate: number
          recurring: string
          shift_date: string
          shift_notes: string | null
          shift_type: string
          start_date: string | null
          start_time: string | null
          total_orders: number
          total_tips: number
          updated_at: string
        }
        Insert: {
          allow_overtime?: boolean
          assign_section?: string | null
          break_minutes?: number
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          job_type?: string | null
          pay_rate?: number
          recurring?: string
          shift_date: string
          shift_notes?: string | null
          shift_type?: string
          start_date?: string | null
          start_time?: string | null
          total_orders?: number
          total_tips?: number
          updated_at?: string
        }
        Update: {
          allow_overtime?: boolean
          assign_section?: string | null
          break_minutes?: number
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          end_time?: string | null
          id?: string
          job_type?: string | null
          pay_rate?: number
          recurring?: string
          shift_date?: string
          shift_notes?: string | null
          shift_type?: string
          start_date?: string | null
          start_time?: string | null
          total_orders?: number
          total_tips?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_stores: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          is_primary: boolean
          store_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          is_primary?: boolean
          store_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          is_primary?: boolean
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_stores_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_stores_store_id_fkey"
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
          dashboard_access: boolean
          email: string | null
          employee_code: string | null
          full_name: string
          hourly_rate: number
          id: string
          is_archived: boolean
          is_on_leave: boolean
          merchant_id: string | null
          payroll_enabled: boolean
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
          dashboard_access?: boolean
          email?: string | null
          employee_code?: string | null
          full_name: string
          hourly_rate?: number
          id?: string
          is_archived?: boolean
          is_on_leave?: boolean
          merchant_id?: string | null
          payroll_enabled?: boolean
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
          dashboard_access?: boolean
          email?: string | null
          employee_code?: string | null
          full_name?: string
          hourly_rate?: number
          id?: string
          is_archived?: boolean
          is_on_leave?: boolean
          merchant_id?: string | null
          payroll_enabled?: boolean
          phone?: string | null
          pin?: string
          revenue_center?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_areas: {
        Row: {
          anchor: string
          bg_color: string
          color: string
          created_at: string
          id: string
          merchant_id: string | null
          name: string
          sort_order: number
          x: number
          y: number
        }
        Insert: {
          anchor?: string
          bg_color?: string
          color?: string
          created_at?: string
          id?: string
          merchant_id?: string | null
          name: string
          sort_order?: number
          x?: number
          y?: number
        }
        Update: {
          anchor?: string
          bg_color?: string
          color?: string
          created_at?: string
          id?: string
          merchant_id?: string | null
          name?: string
          sort_order?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "floor_areas_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_dividers: {
        Row: {
          created_at: string
          id: string
          merchant_id: string | null
          orientation: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          orientation?: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          merchant_id?: string | null
          orientation?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "floor_dividers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      gratuity_settings: {
        Row: {
          allow_custom: boolean
          auto_close_payment_methods: Json
          created_at: string
          device_id: string
          disable_tip_on_cfd: boolean
          enable_tip: boolean
          id: string
          preset_type: string
          selected_tip_presets: Json
          show_on_receipt: boolean
          tip_presets: Json
          updated_at: string
        }
        Insert: {
          allow_custom?: boolean
          auto_close_payment_methods?: Json
          created_at?: string
          device_id: string
          disable_tip_on_cfd?: boolean
          enable_tip?: boolean
          id?: string
          preset_type?: string
          selected_tip_presets?: Json
          show_on_receipt?: boolean
          tip_presets?: Json
          updated_at?: string
        }
        Update: {
          allow_custom?: boolean
          auto_close_payment_methods?: Json
          created_at?: string
          device_id?: string
          disable_tip_on_cfd?: boolean
          enable_tip?: boolean
          id?: string
          preset_type?: string
          selected_tip_presets?: Json
          show_on_receipt?: boolean
          tip_presets?: Json
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          archived: boolean
          created_at: string
          display_name: string | null
          has_max_selections: boolean
          id: string
          max_selections: number
          modifier_group_position: number | null
          name: string
          selected_add_ons: Json | null
          selected_default_modifiers: Json | null
          selected_modifiers: Json | null
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          display_name?: string | null
          has_max_selections?: boolean
          id?: string
          max_selections?: number
          modifier_group_position?: number | null
          name: string
          selected_add_ons?: Json | null
          selected_default_modifiers?: Json | null
          selected_modifiers?: Json | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          display_name?: string | null
          has_max_selections?: boolean
          id?: string
          max_selections?: number
          modifier_group_position?: number | null
          name?: string
          selected_add_ons?: Json | null
          selected_default_modifiers?: Json | null
          selected_modifiers?: Json | null
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_feedback: {
        Row: {
          comment: string
          created_at: string
          feedback_date: string
          guest_id: string | null
          guest_name: string
          id: string
          merchant_id: string | null
          platform: string
          sentiment: string
        }
        Insert: {
          comment?: string
          created_at?: string
          feedback_date: string
          guest_id?: string | null
          guest_name: string
          id?: string
          merchant_id?: string | null
          platform?: string
          sentiment?: string
        }
        Update: {
          comment?: string
          created_at?: string
          feedback_date?: string
          guest_id?: string | null
          guest_name?: string
          id?: string
          merchant_id?: string | null
          platform?: string
          sentiment?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_feedback_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
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
          last_order_date: string | null
          license_plate: string | null
          loyalty: string | null
          loyalty_points_balance: number
          merchant_id: string | null
          middle_name: string | null
          name: string
          notes_allergies: string | null
          notes_general: string | null
          notes_seating_preferences: string | null
          notes_special_note: string | null
          notes_special_relation: string | null
          order_count: number
          phone: string | null
          since: string | null
          tags: string[] | null
          total_points_earned: number
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          address?: string | null
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
          last_order_date?: string | null
          license_plate?: string | null
          loyalty?: string | null
          loyalty_points_balance?: number
          merchant_id?: string | null
          middle_name?: string | null
          name: string
          notes_allergies?: string | null
          notes_general?: string | null
          notes_seating_preferences?: string | null
          notes_special_note?: string | null
          notes_special_relation?: string | null
          order_count?: number
          phone?: string | null
          since?: string | null
          tags?: string[] | null
          total_points_earned?: number
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          address?: string | null
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
          last_order_date?: string | null
          license_plate?: string | null
          loyalty?: string | null
          loyalty_points_balance?: number
          merchant_id?: string | null
          middle_name?: string | null
          name?: string
          notes_allergies?: string | null
          notes_general?: string | null
          notes_seating_preferences?: string | null
          notes_special_note?: string | null
          notes_special_relation?: string | null
          order_count?: number
          phone?: string | null
          since?: string | null
          tags?: string[] | null
          total_points_earned?: number
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          category: string
          compatible_plans: Database["public"]["Enums"]["plan_tier"][] | null
          config_schema: Json | null
          controlled_by: string
          created_at: string
          credential_owner: string
          customer_visible: boolean
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          tier: Database["public"]["Enums"]["integration_tier"]
          updated_at: string
        }
        Insert: {
          category: string
          compatible_plans?: Database["public"]["Enums"]["plan_tier"][] | null
          config_schema?: Json | null
          controlled_by?: string
          created_at?: string
          credential_owner?: string
          customer_visible?: boolean
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tier?: Database["public"]["Enums"]["integration_tier"]
          updated_at?: string
        }
        Update: {
          category?: string
          compatible_plans?: Database["public"]["Enums"]["plan_tier"][] | null
          config_schema?: Json | null
          controlled_by?: string
          created_at?: string
          credential_owner?: string
          customer_visible?: boolean
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tier?: Database["public"]["Enums"]["integration_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          balance_after: number
          created_at: string
          description: string
          guest_id: string
          id: string
          order_id: string | null
          points: number
          type: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          description?: string
          guest_id: string
          id?: string
          order_id?: string | null
          points: number
          type?: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          description?: string
          guest_id?: string
          id?: string
          order_id?: string | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          merchant_id: string | null
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
          merchant_id?: string | null
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
          merchant_id?: string | null
          name?: string
          revenue_centers?: string[]
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          brand_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          location_count: number
          mrr: number
          name: string
          onboarded_at: string | null
          plan_id: string | null
          reseller_id: string | null
          slug: string
          status: Database["public"]["Enums"]["merchant_status"]
          sub_vertical_id: string | null
          updated_at: string
          user_count: number
          user_id: string | null
          vertical_id: string | null
        }
        Insert: {
          brand_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          location_count?: number
          mrr?: number
          name: string
          onboarded_at?: string | null
          plan_id?: string | null
          reseller_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["merchant_status"]
          sub_vertical_id?: string | null
          updated_at?: string
          user_count?: number
          user_id?: string | null
          vertical_id?: string | null
        }
        Update: {
          brand_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          location_count?: number
          mrr?: number
          name?: string
          onboarded_at?: string | null
          plan_id?: string | null
          reseller_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["merchant_status"]
          sub_vertical_id?: string | null
          updated_at?: string
          user_count?: number
          user_id?: string | null
          vertical_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchants_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_sub_vertical_id_fkey"
            columns: ["sub_vertical_id"]
            isOneToOne: false
            referencedRelation: "sub_verticals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "verticals"
            referencedColumns: ["id"]
          },
        ]
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
      open_shifts: {
        Row: {
          allow_overtime: boolean | null
          breaks: Json | null
          created_at: string
          day_selection_mode: string | null
          end_time: string | null
          id: string
          next_day: boolean | null
          recurring: boolean | null
          selected_days: string[] | null
          shift_date: string
          shift_name: string
          shift_note: string | null
          shift_type: string
          start_time: string | null
        }
        Insert: {
          allow_overtime?: boolean | null
          breaks?: Json | null
          created_at?: string
          day_selection_mode?: string | null
          end_time?: string | null
          id?: string
          next_day?: boolean | null
          recurring?: boolean | null
          selected_days?: string[] | null
          shift_date: string
          shift_name: string
          shift_note?: string | null
          shift_type?: string
          start_time?: string | null
        }
        Update: {
          allow_overtime?: boolean | null
          breaks?: Json | null
          created_at?: string
          day_selection_mode?: string | null
          end_time?: string | null
          id?: string
          next_day?: boolean | null
          recurring?: boolean | null
          selected_days?: string[] | null
          shift_date?: string
          shift_name?: string
          shift_note?: string | null
          shift_type?: string
          start_time?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          category: string
          id: string
          item_name: string
          merchant_id: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          category?: string
          id?: string
          item_name: string
          merchant_id?: string | null
          order_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          category?: string
          id?: string
          item_name?: string
          merchant_id?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
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
          guest_id: string | null
          id: string
          merchant_id: string | null
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
          guest_id?: string | null
          id?: string
          merchant_id?: string | null
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
          guest_id?: string | null
          id?: string
          merchant_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "orders_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          device_id: string
          enabled: boolean
          id: string
          method_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          enabled?: boolean
          id?: string
          method_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          enabled?: boolean
          id?: string
          method_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          allowed_integration_tiers:
            | Database["public"]["Enums"]["integration_tier"][]
            | null
          allowed_verticals: string[] | null
          base_price: number
          billing_cycle: string
          created_at: string
          currency: string
          description: string | null
          feature_flags: Json | null
          id: string
          is_active: boolean
          max_locations: number | null
          max_products: number | null
          max_users: number | null
          name: string
          slug: string
          sort_order: number
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
        }
        Insert: {
          allowed_integration_tiers?:
            | Database["public"]["Enums"]["integration_tier"][]
            | null
          allowed_verticals?: string[] | null
          base_price?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          max_locations?: number | null
          max_products?: number | null
          max_users?: number | null
          name: string
          slug: string
          sort_order?: number
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
        }
        Update: {
          allowed_integration_tiers?:
            | Database["public"]["Enums"]["integration_tier"][]
            | null
          allowed_verticals?: string[] | null
          base_price?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          max_locations?: number | null
          max_products?: number | null
          max_users?: number | null
          name?: string
          slug?: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      platform_add_ons: {
        Row: {
          billing_cycle: string
          compatible_plans: Database["public"]["Enums"]["plan_tier"][] | null
          created_at: string
          currency: string
          description: string | null
          feature_flags: Json | null
          id: string
          is_active: boolean
          name: string
          price: number
          slug: string
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          compatible_plans?: Database["public"]["Enums"]["plan_tier"][] | null
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          slug: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          compatible_plans?: Database["public"]["Enums"]["plan_tier"][] | null
          created_at?: string
          currency?: string
          description?: string | null
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
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
      product_variants: {
        Row: {
          adjusted_price: number
          created_at: string
          id: string
          price: number
          product_id: string
          sku: string | null
          sort_order: number
          timed_price: number
          timed_price_enabled: boolean
          timed_price_end: string | null
          timed_price_start: string | null
          updated_at: string
          variant_name: string
        }
        Insert: {
          adjusted_price?: number
          created_at?: string
          id?: string
          price?: number
          product_id: string
          sku?: string | null
          sort_order?: number
          timed_price?: number
          timed_price_enabled?: boolean
          timed_price_end?: string | null
          timed_price_start?: string | null
          updated_at?: string
          variant_name?: string
        }
        Update: {
          adjusted_price?: number
          created_at?: string
          id?: string
          price?: number
          product_id?: string
          sku?: string | null
          sort_order?: number
          timed_price?: number
          timed_price_enabled?: boolean
          timed_price_end?: string | null
          timed_price_start?: string | null
          updated_at?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
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
          allergens: string[] | null
          archived: boolean
          calories: number | null
          carbs: string | null
          category_id: string
          created_at: string
          delivery: boolean
          description: string | null
          dine_in: boolean
          fat: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          inventory_tracking: boolean
          max_price: number | null
          merchant_id: string | null
          min_price: number | null
          name: string
          negative_inventory: boolean
          out_of_stock: boolean
          popular: boolean
          price: number
          price_type: string
          protein: string | null
          sku: string | null
          sort_order: number
          takeaway: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          allergens?: string[] | null
          archived?: boolean
          calories?: number | null
          carbs?: string | null
          category_id: string
          created_at?: string
          delivery?: boolean
          description?: string | null
          dine_in?: boolean
          fat?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          inventory_tracking?: boolean
          max_price?: number | null
          merchant_id?: string | null
          min_price?: number | null
          name: string
          negative_inventory?: boolean
          out_of_stock?: boolean
          popular?: boolean
          price?: number
          price_type?: string
          protein?: string | null
          sku?: string | null
          sort_order?: number
          takeaway?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          allergens?: string[] | null
          archived?: boolean
          calories?: number | null
          carbs?: string | null
          category_id?: string
          created_at?: string
          delivery?: boolean
          description?: string | null
          dine_in?: boolean
          fat?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          inventory_tracking?: boolean
          max_price?: number | null
          merchant_id?: string | null
          min_price?: number | null
          name?: string
          negative_inventory?: boolean
          out_of_stock?: boolean
          popular?: boolean
          price?: number
          price_type?: string
          protein?: string | null
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
          {
            foreignKeyName: "products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      resellers: {
        Row: {
          brand_id: string
          can_assign_plans: boolean
          can_configure_branding: boolean
          can_configure_integrations: boolean
          can_manage_merchants: boolean
          can_view_revenue: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          merchant_count: number
          mrr: number
          name: string
          slug: string
          status: Database["public"]["Enums"]["brand_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_id: string
          can_assign_plans?: boolean
          can_configure_branding?: boolean
          can_configure_integrations?: boolean
          can_manage_merchants?: boolean
          can_view_revenue?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          merchant_count?: number
          mrr?: number
          name: string
          slug: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          can_assign_plans?: boolean
          can_configure_branding?: boolean
          can_configure_integrations?: boolean
          can_manage_merchants?: boolean
          can_view_revenue?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          merchant_count?: number
          mrr?: number
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resellers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          color_category: string | null
          created_at: string
          end_time: string | null
          guest_id: string | null
          guest_name: string
          id: string
          location: string | null
          merchant_id: string | null
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
          guest_id?: string | null
          guest_name: string
          id?: string
          location?: string | null
          merchant_id?: string | null
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
          guest_id?: string | null
          guest_name?: string
          id?: string
          location?: string | null
          merchant_id?: string | null
          no_show?: boolean
          party_size?: number
          reservation_date?: string
          start_time?: string
          status?: string
          title?: string | null
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          created_at: string
          floor_area: string
          guests: number
          id: string
          is_merge_source: boolean
          merchant_id: string | null
          merge_group_id: string | null
          merged_with: string | null
          occupied_seats: Json
          seats: number
          shape: string
          sort_order: number
          status: string
          table_number: string
          time: string
          updated_at: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          floor_area?: string
          guests?: number
          id?: string
          is_merge_source?: boolean
          merchant_id?: string | null
          merge_group_id?: string | null
          merged_with?: string | null
          occupied_seats?: Json
          seats?: number
          shape?: string
          sort_order?: number
          status?: string
          table_number: string
          time?: string
          updated_at?: string
          x?: number
          y?: number
        }
        Update: {
          created_at?: string
          floor_area?: string
          guests?: number
          id?: string
          is_merge_source?: boolean
          merchant_id?: string | null
          merge_group_id?: string | null
          merged_with?: string | null
          occupied_seats?: Json
          seats?: number
          shape?: string
          sort_order?: number
          status?: string
          table_number?: string
          time?: string
          updated_at?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_charges: {
        Row: {
          amount: number
          applied_as: string | null
          archived: boolean
          automatic_apply: boolean
          created_at: string
          device_id: string
          id: string
          is_active: boolean
          min_seats: number
          name: string
          order_type: string | null
          requires_manager_pin: boolean
          sort_order: number
          tax_applicable: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          applied_as?: string | null
          archived?: boolean
          automatic_apply?: boolean
          created_at?: string
          device_id: string
          id?: string
          is_active?: boolean
          min_seats?: number
          name: string
          order_type?: string | null
          requires_manager_pin?: boolean
          sort_order?: number
          tax_applicable?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          applied_as?: string | null
          archived?: boolean
          automatic_apply?: boolean
          created_at?: string
          device_id?: string
          id?: string
          is_active?: boolean
          min_seats?: number
          name?: string
          order_type?: string | null
          requires_manager_pin?: boolean
          sort_order?: number
          tax_applicable?: string | null
          type?: string
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
          merchant_id: string | null
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
          merchant_id?: string | null
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
          merchant_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_verticals: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["vertical_status"]
          tier: Database["public"]["Enums"]["integration_tier"]
          updated_at: string
          vertical_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["vertical_status"]
          tier?: Database["public"]["Enums"]["integration_tier"]
          updated_at?: string
          vertical_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["vertical_status"]
          tier?: Database["public"]["Enums"]["integration_tier"]
          updated_at?: string
          vertical_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_verticals_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "verticals"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes: {
        Row: {
          amount: number
          applicable_products: Json | null
          applicable_to: string | null
          archived: boolean
          created_at: string
          device_id: string
          id: string
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          applicable_products?: Json | null
          applicable_to?: string | null
          archived?: boolean
          created_at?: string
          device_id: string
          id?: string
          name: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          applicable_products?: Json | null
          applicable_to?: string | null
          archived?: boolean
          created_at?: string
          device_id?: string
          id?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_order_items: {
        Row: {
          created_at: string
          id: string
          is_fired: boolean
          is_shared: boolean
          modifiers: string[]
          name: string
          no_tax: boolean
          order_id: string
          price: number
          qty: number
          seats: number[]
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_fired?: boolean
          is_shared?: boolean
          modifiers?: string[]
          name: string
          no_tax?: boolean
          order_id: string
          price?: number
          qty?: number
          seats?: number[]
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_fired?: boolean
          is_shared?: boolean
          modifiers?: string[]
          name?: string
          no_tax?: boolean
          order_id?: string
          price?: number
          qty?: number
          seats?: number[]
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          check_number: string
          created_at: string
          discount: number
          id: string
          merged_from: Json | null
          name: string
          notes: string
          order_number: number
          order_type: string
          paid_amount: string | null
          party_size: number
          payment_status: string | null
          payment_type: string
          payments: Json | null
          phone: string
          revenue_center: string
          server: string
          service_charge: number
          session_id: string | null
          split_configuration: Json | null
          status: string
          subtotal: number
          table_id: string
          tax: number
          time: string
          timer: string
          tip: number
          total: number
          transfer_info: Json | null
          transferred_from: Json | null
          updated_at: string
        }
        Insert: {
          check_number?: string
          created_at?: string
          discount?: number
          id?: string
          merged_from?: Json | null
          name?: string
          notes?: string
          order_number?: number
          order_type?: string
          paid_amount?: string | null
          party_size?: number
          payment_status?: string | null
          payment_type?: string
          payments?: Json | null
          phone?: string
          revenue_center?: string
          server?: string
          service_charge?: number
          session_id?: string | null
          split_configuration?: Json | null
          status?: string
          subtotal?: number
          table_id?: string
          tax?: number
          time?: string
          timer?: string
          tip?: number
          total?: number
          transfer_info?: Json | null
          transferred_from?: Json | null
          updated_at?: string
        }
        Update: {
          check_number?: string
          created_at?: string
          discount?: number
          id?: string
          merged_from?: Json | null
          name?: string
          notes?: string
          order_number?: number
          order_type?: string
          paid_amount?: string | null
          party_size?: number
          payment_status?: string | null
          payment_type?: string
          payments?: Json | null
          phone?: string
          revenue_center?: string
          server?: string
          service_charge?: number
          session_id?: string | null
          split_configuration?: Json | null
          status?: string
          subtotal?: number
          table_id?: string
          tax?: number
          time?: string
          timer?: string
          tip?: number
          total?: number
          transfer_info?: Json | null
          transferred_from?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      timed_pricing_rules: {
        Row: {
          adjustment: number
          created_at: string
          days: string[]
          enabled: boolean
          end_time: string
          id: string
          name: string
          start_time: string
          type: string
          updated_at: string
        }
        Insert: {
          adjustment?: number
          created_at?: string
          days?: string[]
          enabled?: boolean
          end_time?: string
          id?: string
          name: string
          start_time?: string
          type?: string
          updated_at?: string
        }
        Update: {
          adjustment?: number
          created_at?: string
          days?: string[]
          enabled?: boolean
          end_time?: string
          id?: string
          name?: string
          start_time?: string
          type?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verticals: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["vertical_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["vertical_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["vertical_status"]
          updated_at?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          buyer_type: string
          code: string
          created_at: string
          customer_name: string | null
          device_id: string | null
          enable_qr_barcode: boolean
          expiry_date: string | null
          id: string
          min_order_amount: number
          name: string
          notes: string | null
          recipient_email: string | null
          recipient_phone: string | null
          redemption_limit: number
          redemption_mode: string
          remaining_balance: number
          selling_price: number
          service_fee_type: string
          service_fee_value: number
          status: string
          tags: string | null
          times_redeemed: number
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          buyer_type?: string
          code: string
          created_at?: string
          customer_name?: string | null
          device_id?: string | null
          enable_qr_barcode?: boolean
          expiry_date?: string | null
          id?: string
          min_order_amount?: number
          name?: string
          notes?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          redemption_limit?: number
          redemption_mode?: string
          remaining_balance?: number
          selling_price?: number
          service_fee_type?: string
          service_fee_value?: number
          status?: string
          tags?: string | null
          times_redeemed?: number
          type?: string
          updated_at?: string
          value?: number
        }
        Update: {
          buyer_type?: string
          code?: string
          created_at?: string
          customer_name?: string | null
          device_id?: string | null
          enable_qr_barcode?: boolean
          expiry_date?: string | null
          id?: string
          min_order_amount?: number
          name?: string
          notes?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          redemption_limit?: number
          redemption_mode?: string
          remaining_balance?: number
          selling_price?: number
          service_fee_type?: string
          service_fee_value?: number
          status?: string
          tags?: string | null
          times_redeemed?: number
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_brand_id: { Args: { _user_id: string }; Returns: string }
      get_user_merchant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_merchant_of_brand: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
      owns_brand: {
        Args: { _brand_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "customer_success"
        | "support"
        | "finance"
        | "brand_manager"
        | "viewer"
      brand_status: "draft" | "active" | "suspended" | "archived"
      integration_tier: "core" | "standard" | "premium"
      merchant_status: "active" | "inactive" | "suspended" | "churned"
      plan_tier: "starter" | "pro" | "enterprise"
      vertical_status: "active" | "inactive"
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
      app_role: [
        "super_admin",
        "customer_success",
        "support",
        "finance",
        "brand_manager",
        "viewer",
      ],
      brand_status: ["draft", "active", "suspended", "archived"],
      integration_tier: ["core", "standard", "premium"],
      merchant_status: ["active", "inactive", "suspended", "churned"],
      plan_tier: ["starter", "pro", "enterprise"],
      vertical_status: ["active", "inactive"],
    },
  },
} as const
