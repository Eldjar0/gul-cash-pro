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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          sale_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          sale_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          sale_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          configuration: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          recipients: string[] | null
          report_type: string
          schedule: string | null
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          recipients?: string[] | null
          report_type: string
          schedule?: string | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          recipients?: string[] | null
          report_type?: string
          schedule?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_access_log: {
        Row: {
          accessed_at: string | null
          action: string
          customer_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          action: string
          customer_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          action?: string
          customer_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_access_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credit_accounts: {
        Row: {
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          customer_id: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          customer_id: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          customer_id?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          customer_id: string
          id: string
          notes: string | null
          sale_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          sale_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          sale_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_order_items: {
        Row: {
          created_at: string | null
          customer_order_id: string
          id: string
          product_barcode: string | null
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          customer_order_id: string
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Update: {
          created_at?: string | null
          customer_order_id?: string
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          total?: number
          unit_price?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_order_items_customer_order_id_fkey"
            columns: ["customer_order_id"]
            isOneToOne: false
            referencedRelation: "customer_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_orders: {
        Row: {
          completed_date: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deposit_paid: number | null
          id: string
          notes: string | null
          notified: boolean | null
          order_date: string
          order_number: string
          ready_date: string | null
          remaining_balance: number | null
          status: string
          subtotal: number
          total: number
          total_vat: number
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_paid?: number | null
          id?: string
          notes?: string | null
          notified?: boolean | null
          order_date?: string
          order_number: string
          ready_date?: string | null
          remaining_balance?: number | null
          status?: string
          subtotal: number
          total: number
          total_vat: number
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_paid?: number | null
          id?: string
          notes?: string | null
          notified?: boolean | null
          order_date?: string
          order_number?: string
          ready_date?: string | null
          remaining_balance?: number | null
          status?: string
          subtotal?: number
          total?: number
          total_vat?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segment_members: {
        Row: {
          added_at: string | null
          customer_id: string
          id: string
          segment_id: string
        }
        Insert: {
          added_at?: string | null
          customer_id: string
          id?: string
          segment_id: string
        }
        Update: {
          added_at?: string | null
          customer_id?: string
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segment_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_special_prices: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          product_id: string
          special_price: number
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          product_id: string
          special_price: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          product_id?: string
          special_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_special_prices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_special_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          credit_blocked: boolean | null
          email: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          credit_blocked?: boolean | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          credit_blocked?: boolean | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          cashier_id: string | null
          closing_amount: number | null
          created_at: string | null
          id: string
          opening_amount: number
          report_date: string
          sales_count: number
          serial_number: string | null
          total_card: number
          total_cash: number
          total_mobile: number
          total_sales: number
        }
        Insert: {
          cashier_id?: string | null
          closing_amount?: number | null
          created_at?: string | null
          id?: string
          opening_amount?: number
          report_date: string
          sales_count?: number
          serial_number?: string | null
          total_card?: number
          total_cash?: number
          total_mobile?: number
          total_sales?: number
        }
        Update: {
          cashier_id?: string | null
          closing_amount?: number | null
          created_at?: string | null
          id?: string
          opening_amount?: number
          report_date?: string
          sales_count?: number
          serial_number?: string | null
          total_card?: number
          total_cash?: number
          total_mobile?: number
          total_sales?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_receipts: {
        Row: {
          created_at: string | null
          fiscal_number: string
          fiscal_year: number
          id: string
          issue_date: string
          sale_id: string
        }
        Insert: {
          created_at?: string | null
          fiscal_number: string
          fiscal_year?: number
          id?: string
          issue_date?: string
          sale_id: string
        }
        Update: {
          created_at?: string | null
          fiscal_number?: string
          fiscal_year?: number
          id?: string
          issue_date?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_receipts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          gift_card_id: string
          id: string
          sale_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          gift_card_id: string
          id?: string
          sale_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          gift_card_id?: string
          id?: string
          sale_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          card_number: string
          card_type: string
          created_at: string | null
          current_balance: number
          customer_id: string | null
          expiry_date: string | null
          id: string
          initial_balance: number
          is_active: boolean | null
          issued_date: string
          updated_at: string | null
        }
        Insert: {
          card_number: string
          card_type?: string
          created_at?: string | null
          current_balance: number
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          initial_balance: number
          is_active?: boolean | null
          issued_date?: string
          updated_at?: string | null
        }
        Update: {
          card_number?: string
          card_type?: string
          created_at?: string | null
          current_balance?: number
          customer_id?: string | null
          expiry_date?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean | null
          issued_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_count_items: {
        Row: {
          counted_quantity: number | null
          created_at: string | null
          expected_quantity: number
          id: string
          inventory_count_id: string
          notes: string | null
          product_barcode: string | null
          product_id: string
          product_name: string
          unit_cost: number | null
          variance: number | null
          variance_value: number | null
        }
        Insert: {
          counted_quantity?: number | null
          created_at?: string | null
          expected_quantity: number
          id?: string
          inventory_count_id: string
          notes?: string | null
          product_barcode?: string | null
          product_id: string
          product_name: string
          unit_cost?: number | null
          variance?: number | null
          variance_value?: number | null
        }
        Update: {
          counted_quantity?: number | null
          created_at?: string | null
          expected_quantity?: number
          id?: string
          inventory_count_id?: string
          notes?: string | null
          product_barcode?: string | null
          product_id?: string
          product_name?: string
          unit_cost?: number | null
          variance?: number | null
          variance_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_inventory_count_id_fkey"
            columns: ["inventory_count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          completed_at: string | null
          count_date: string
          count_number: string
          counted_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string
          total_variance_value: number | null
          validated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          count_date?: string
          count_number: string
          counted_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_variance_value?: number | null
          validated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          count_date?: string
          count_number?: string
          counted_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_variance_value?: number | null
          validated_by?: string | null
        }
        Relationships: []
      }
      label_configurations: {
        Row: {
          created_at: string | null
          format: Json
          id: string
          name: string
          template: Json
        }
        Insert: {
          created_at?: string | null
          format: Json
          id?: string
          name: string
          template: Json
        }
        Update: {
          created_at?: string | null
          format?: Json
          id?: string
          name?: string
          template?: Json
        }
        Relationships: []
      }
      loyalty_tiers: {
        Row: {
          benefits: string | null
          color: string | null
          created_at: string | null
          discount_percentage: number | null
          id: string
          min_spent: number
          name: string
          points_multiplier: number | null
          tier: Database["public"]["Enums"]["loyalty_tier"]
        }
        Insert: {
          benefits?: string | null
          color?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          min_spent?: number
          name: string
          points_multiplier?: number | null
          tier: Database["public"]["Enums"]["loyalty_tier"]
        }
        Update: {
          benefits?: string | null
          color?: string | null
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          min_spent?: number
          name?: string
          points_multiplier?: number | null
          tier?: Database["public"]["Enums"]["loyalty_tier"]
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          created_at: string | null
          customer_id: string
          description: string | null
          expires_at: string | null
          id: string
          points: number
          sale_id: string | null
          transaction_type: string
        }
        Insert: {
          balance_after: number
          created_at?: string | null
          customer_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points: number
          sale_id?: string | null
          transaction_type: string
        }
        Update: {
          balance_after?: number
          created_at?: string | null
          customer_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          points?: number
          sale_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          campaign_type: string
          converted_count: number | null
          created_at: string | null
          discount_code: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string
          message_template: string | null
          name: string
          opened_count: number | null
          segment_id: string | null
          sent_count: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          converted_count?: number | null
          created_at?: string | null
          discount_code?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          message_template?: string | null
          name: string
          opened_count?: number | null
          segment_id?: string | null
          sent_count?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          converted_count?: number | null
          created_at?: string | null
          discount_code?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          message_template?: string | null
          name?: string
          opened_count?: number | null
          segment_id?: string | null
          sent_count?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_orders: {
        Row: {
          created_at: string
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          card_last4: string | null
          check_date: string | null
          check_number: string | null
          created_at: string | null
          id: string
          payment_method: string
          refund_id: string | null
          sale_id: string | null
          status: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          card_last4?: string | null
          check_date?: string | null
          check_number?: string | null
          created_at?: string | null
          id?: string
          payment_method: string
          refund_id?: string | null
          sale_id?: string | null
          status?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          card_last4?: string | null
          check_date?: string | null
          check_number?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string
          refund_id?: string | null
          sale_id?: string | null
          status?: string | null
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      product_barcodes: {
        Row: {
          barcode: string
          created_at: string | null
          id: string
          is_primary: boolean
          product_id: string
        }
        Insert: {
          barcode: string
          created_at?: string | null
          id?: string
          is_primary?: boolean
          product_id: string
        }
        Update: {
          barcode?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          created_at: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          product_id: string
          purchase_order_id: string | null
          quantity: number
          received_date: string
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id: string
          purchase_order_id?: string | null
          quantity?: number
          received_date?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          purchase_order_id?: string | null
          quantity?: number
          received_date?: string
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          is_active: boolean | null
          min_stock: number | null
          name: string
          price: number
          stock: number | null
          supplier: string | null
          type: Database["public"]["Enums"]["product_type"]
          unit: string | null
          updated_at: string | null
          vat_rate: number
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name: string
          price: number
          stock?: number | null
          supplier?: string | null
          type?: Database["public"]["Enums"]["product_type"]
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name?: string
          price?: number
          stock?: number | null
          supplier?: string | null
          type?: Database["public"]["Enums"]["product_type"]
          unit?: string | null
          updated_at?: string | null
          vat_rate?: number
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
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          pin_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          pin_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          pin_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          conditions: Json
          created_at: string | null
          customer_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          schedule_config: Json | null
          schedule_type: string | null
          show_on_display: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          schedule_config?: Json | null
          schedule_type?: string | null
          show_on_display?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          customer_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          schedule_config?: Json | null
          schedule_type?: string | null
          show_on_display?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          product_barcode: string | null
          product_id: string | null
          product_name: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number | null
          subtotal: number
          tax_rate: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received?: number | null
          subtotal: number
          tax_rate?: number | null
          unit_cost: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number | null
          subtotal?: number
          tax_rate?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_id: string | null
          tax_amount: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          id: string
          product_barcode: string | null
          product_id: string | null
          product_name: string
          quantity: number
          quote_id: string
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          quote_id: string
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          quote_id?: string
          subtotal?: number
          total?: number
          unit_price?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          converted_to_sale_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          quote_date: string
          quote_number: string
          status: string
          subtotal: number
          total: number
          total_vat: number
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          converted_to_sale_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          quote_date?: string
          quote_number: string
          status?: string
          subtotal: number
          total: number
          total_vat: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          converted_to_sale_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          quote_date?: string
          quote_number?: string
          status?: string
          subtotal?: number
          total?: number
          total_vat?: number
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_converted_to_sale_id_fkey"
            columns: ["converted_to_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_items: {
        Row: {
          created_at: string | null
          id: string
          product_barcode: string | null
          product_id: string | null
          product_name: string
          quantity: number
          refund_id: string
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          refund_id: string
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          refund_id?: string
          subtotal?: number
          total?: number
          unit_price?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "refund_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_items_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          original_sale_id: string | null
          payment_method: string
          reason: string
          refund_number: string
          refund_type: string
          subtotal: number
          total: number
          total_vat: number
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          original_sale_id?: string | null
          payment_method: string
          reason: string
          refund_number: string
          refund_type: string
          subtotal: number
          total: number
          total_vat: number
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          original_sale_id?: string | null
          payment_method?: string
          reason?: string
          refund_number?: string
          refund_type?: string
          subtotal?: number
          total?: number
          total_vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "refunds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_original_sale_id_fkey"
            columns: ["original_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_scan_sessions: {
        Row: {
          cashier_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          session_code: string
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          session_code: string
        }
        Update: {
          cashier_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          session_code?: string
        }
        Relationships: []
      }
      remote_scanned_items: {
        Row: {
          barcode: string
          created_at: string | null
          id: string
          processed: boolean | null
          quantity: number | null
          session_id: string
        }
        Insert: {
          barcode: string
          created_at?: string | null
          id?: string
          processed?: boolean | null
          quantity?: number | null
          session_id: string
        }
        Update: {
          barcode?: string
          created_at?: string | null
          id?: string
          processed?: boolean | null
          quantity?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remote_scanned_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "remote_scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          original_price: number | null
          product_barcode: string | null
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          original_price?: number | null
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          total: number
          unit_price: number
          vat_amount: number
          vat_rate: number
        }
        Update: {
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          original_price?: number | null
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          total?: number
          unit_price?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_paid: number | null
          cashier_id: string | null
          change_amount: number | null
          created_at: string | null
          customer_id: string | null
          date: string | null
          due_date: string | null
          id: string
          invoice_status: string | null
          is_cancelled: boolean | null
          is_invoice: boolean | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_methods: Json | null
          payment_split: Json | null
          sale_number: string
          source: string | null
          subtotal: number
          total: number
          total_discount: number | null
          total_vat: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          cashier_id?: string | null
          change_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          due_date?: string | null
          id?: string
          invoice_status?: string | null
          is_cancelled?: boolean | null
          is_invoice?: boolean | null
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_methods?: Json | null
          payment_split?: Json | null
          sale_number: string
          source?: string | null
          subtotal: number
          total: number
          total_discount?: number | null
          total_vat: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          cashier_id?: string | null
          change_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          due_date?: string | null
          id?: string
          invoice_status?: string | null
          is_cancelled?: boolean | null
          is_invoice?: boolean | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_methods?: Json | null
          payment_split?: Json | null
          sale_number?: string
          source?: string | null
          subtotal?: number
          total?: number
          total_discount?: number | null
          total_vat?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_carts: {
        Row: {
          cart_data: Json
          cart_name: string
          cashier_id: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          cart_data: Json
          cart_name: string
          cashier_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          cart_data?: Json
          cart_name?: string
          cashier_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          movement_type: string
          new_stock: number
          notes: string | null
          previous_stock: number
          product_barcode: string | null
          product_id: string | null
          product_name: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          movement_type: string
          new_stock: number
          notes?: string | null
          previous_stock: number
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          previous_stock?: number
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_receipt_items: {
        Row: {
          actual_unit_cost: number
          created_at: string | null
          expected_unit_cost: number | null
          has_price_change: boolean | null
          id: string
          notes: string | null
          product_barcode: string | null
          product_id: string | null
          product_name: string
          quantity: number
          receipt_id: string
        }
        Insert: {
          actual_unit_cost: number
          created_at?: string | null
          expected_unit_cost?: number | null
          has_price_change?: boolean | null
          id?: string
          notes?: string | null
          product_barcode?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          receipt_id: string
        }
        Update: {
          actual_unit_cost?: number
          created_at?: string | null
          expected_unit_cost?: number | null
          has_price_change?: boolean | null
          id?: string
          notes?: string | null
          product_barcode?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "supplier_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_receipts: {
        Row: {
          calculated_total: number
          created_at: string | null
          has_discrepancy: boolean | null
          id: string
          notes: string | null
          receipt_number: string
          received_by: string | null
          received_date: string
          status: string
          supplier_id: string | null
          supplier_invoice_number: string | null
          supplier_invoice_total: number | null
          supplier_name: string
          updated_at: string | null
          validated_at: string | null
        }
        Insert: {
          calculated_total?: number
          created_at?: string | null
          has_discrepancy?: boolean | null
          id?: string
          notes?: string | null
          receipt_number: string
          received_by?: string | null
          received_date?: string
          status?: string
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          supplier_invoice_total?: number | null
          supplier_name: string
          updated_at?: string | null
          validated_at?: string | null
        }
        Update: {
          calculated_total?: number
          created_at?: string | null
          has_discrepancy?: boolean | null
          id?: string
          notes?: string | null
          receipt_number?: string
          received_by?: string | null
          received_date?: string
          status?: string
          supplier_id?: string | null
          supplier_invoice_number?: string | null
          supplier_invoice_total?: number | null
          supplier_name?: string
          updated_at?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          favorites: string[] | null
          id: string
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          favorites?: string[] | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          favorites?: string[] | null
          id?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_shifts: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_fiscal_receipt: {
        Args: { p_sale_id: string }
        Returns: {
          fiscal_number: string
        }[]
      }
      generate_customer_order_number: { Args: never; Returns: string }
      generate_fiscal_number: { Args: never; Returns: string }
      generate_inventory_count_number: { Args: never; Returns: string }
      generate_mobile_order_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      generate_refund_number: { Args: never; Returns: string }
      generate_sale_number: {
        Args: { is_invoice_param?: boolean }
        Returns: string
      }
      generate_supplier_receipt_number: { Args: never; Returns: string }
      generate_z_serial_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "viewer"
      loyalty_tier: "bronze" | "silver" | "gold" | "platinum"
      movement_type:
        | "opening"
        | "closing"
        | "deposit"
        | "withdrawal"
        | "sale"
        | "refund"
      payment_method: "cash" | "card" | "mobile" | "check" | "voucher"
      product_type: "unit" | "weight"
      user_role: "admin" | "cashier" | "manager"
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
      app_role: ["admin", "manager", "cashier", "viewer"],
      loyalty_tier: ["bronze", "silver", "gold", "platinum"],
      movement_type: [
        "opening",
        "closing",
        "deposit",
        "withdrawal",
        "sale",
        "refund",
      ],
      payment_method: ["cash", "card", "mobile", "check", "voucher"],
      product_type: ["unit", "weight"],
      user_role: ["admin", "cashier", "manager"],
    },
  },
} as const
