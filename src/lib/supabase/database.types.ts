// ⚠️ Arquivo GERADO. Não edite à mão.
// Regenerar com o banco local rodando: pnpm db:types
// (Versão inicial escrita à mão no S1, no mesmo formato do gerador.)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          archived_at: string | null;
          color: string;
          created_at: string;
          icon: string;
          id: string;
          name: string;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name: string;
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          name?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          name: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          name: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["payment_kind"];
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recurrences: {
        Row: {
          active: boolean;
          amount_cents: number;
          category_id: string;
          created_at: string;
          day_of_month: number;
          description: string;
          ends_on: string | null;
          id: string;
          payment_method_id: string | null;
          starts_on: string;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          amount_cents: number;
          category_id: string;
          created_at?: string;
          day_of_month: number;
          description: string;
          ends_on?: string | null;
          id?: string;
          payment_method_id?: string | null;
          starts_on: string;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          amount_cents?: number;
          category_id?: string;
          created_at?: string;
          day_of_month?: number;
          description?: string;
          ends_on?: string | null;
          id?: string;
          payment_method_id?: string | null;
          starts_on?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount_cents: number;
          category_id: string;
          client_id: string | null;
          created_at: string;
          description: string;
          due_date: string;
          id: string;
          installment_group_id: string | null;
          installment_number: number | null;
          installment_total: number | null;
          interest_cents: number;
          notes: string | null;
          paid_at: string | null;
          paid_cents: number;
          payment_method_id: string | null;
          recurrence_id: string | null;
          status: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount_cents: number;
          category_id: string;
          client_id?: string | null;
          created_at?: string;
          description: string;
          due_date: string;
          id?: string;
          installment_group_id?: string | null;
          installment_number?: number | null;
          installment_total?: number | null;
          interest_cents?: number;
          notes?: string | null;
          paid_at?: string | null;
          paid_cents?: number;
          payment_method_id?: string | null;
          recurrence_id?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount_cents?: number;
          category_id?: string;
          client_id?: string | null;
          created_at?: string;
          description?: string;
          due_date?: string;
          id?: string;
          installment_group_id?: string | null;
          installment_number?: number | null;
          installment_total?: number | null;
          interest_cents?: number;
          notes?: string | null;
          paid_at?: string | null;
          paid_cents?: number;
          payment_method_id?: string | null;
          recurrence_id?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_fkey";
            columns: ["category_id", "user_id", "type"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id", "user_id", "type"];
          },
          {
            foreignKeyName: "transactions_payment_method_fkey";
            columns: ["payment_method_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "payment_methods";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      transactions_with_status: {
        Row: {
          amount_cents: number | null;
          category_id: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          id: string | null;
          installment_group_id: string | null;
          installment_number: number | null;
          installment_total: number | null;
          interest_cents: number | null;
          notes: string | null;
          paid_at: string | null;
          paid_cents: number | null;
          payment_method_id: string | null;
          status: Database["public"]["Enums"]["transaction_status"] | null;
          type: Database["public"]["Enums"]["transaction_type"] | null;
          updated_at: string | null;
          user_id: string | null;
          due_cents: number | null;
          remaining_cents: number | null;
          effective_status: string | null;
          recurrence_id: string | null;
          client_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      seed_user_defaults: { Args: { p_user: string }; Returns: undefined };
      today_sp: { Args: never; Returns: string };
      client_balances: {
        Args: { p_user: string };
        Returns: {
          client_id: string;
          sold_cents: number;
          interest_cents: number;
          received_cents: number;
          remaining_cents: number;
          overdue_cents: number;
          overdue_count: number;
          open_count: number;
          next_due_date: string | null;
        }[];
      };
      generate_recurring_transactions: {
        Args: { p_recurrence?: string };
        Returns: number;
      };
    };
    Enums: {
      installment_interval: "monthly" | "biweekly" | "days";
      payment_kind:
        | "credit_card"
        | "debit_card"
        | "pix"
        | "cash"
        | "boleto"
        | "other";
      transaction_status: "paid" | "pending" | "partial";
      transaction_type: "income" | "expense";
      user_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];
