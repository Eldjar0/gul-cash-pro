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
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          pin_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          pin_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
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
      sale_items: {
        Row: {
          created_at: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
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
          id: string
          is_cancelled: boolean | null
          is_invoice: boolean | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_methods: Json | null
          payment_split: Json | null
          sale_number: string
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
          id?: string
          is_cancelled?: boolean | null
          is_invoice?: boolean | null
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_methods?: Json | null
          payment_split?: Json | null
          sale_number: string
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
          id?: string
          is_cancelled?: boolean | null
          is_invoice?: boolean | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_methods?: Json | null
          payment_split?: Json | null
          sale_number?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_refund_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sale_number: {
        Args: { is_invoice_param?: boolean }
        Returns: string
      }
      generate_z_serial_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "viewer"
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
