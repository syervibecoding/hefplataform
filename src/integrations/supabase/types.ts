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
      checklist_steps: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          position?: number
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          tipo?: string
        }
        Relationships: []
      }
      client_checklists: {
        Row: {
          client_id: string
          created_at: string
          id: string
          periodo: string
          steps: Json
          tipo: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          periodo: string
          steps?: Json
          tipo: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          periodo?: string
          steps?: Json
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_checklists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          agenda_caixas_postais: Json | null
          agenda_certidoes: Json | null
          cnpjs: number | null
          consultas: string[] | null
          consultas_extras: Json | null
          contato: string
          created_at: string
          custo_api: number | null
          data_deposito: string | null
          data_golive: string | null
          data_kickoff: string | null
          email: string
          faturamento: number | null
          forma_pagamento: string | null
          frequencia: string | null
          gasto_diario_medio: number | null
          id: string
          nivel_dificuldade: string | null
          nome: string
          nome_plataforma: string | null
          notas_automacao: string | null
          product_id: string
          rotina_conferencia: Json | null
          saldo_anuncio: number | null
          status: string
          tipo_plataforma: string | null
          updated_at: string
          valor_contrato: number | null
          whatsapp: string
        }
        Insert: {
          agenda_caixas_postais?: Json | null
          agenda_certidoes?: Json | null
          cnpjs?: number | null
          consultas?: string[] | null
          consultas_extras?: Json | null
          contato?: string
          created_at?: string
          custo_api?: number | null
          data_deposito?: string | null
          data_golive?: string | null
          data_kickoff?: string | null
          email?: string
          faturamento?: number | null
          forma_pagamento?: string | null
          frequencia?: string | null
          gasto_diario_medio?: number | null
          id?: string
          nivel_dificuldade?: string | null
          nome: string
          nome_plataforma?: string | null
          notas_automacao?: string | null
          product_id: string
          rotina_conferencia?: Json | null
          saldo_anuncio?: number | null
          status?: string
          tipo_plataforma?: string | null
          updated_at?: string
          valor_contrato?: number | null
          whatsapp?: string
        }
        Update: {
          agenda_caixas_postais?: Json | null
          agenda_certidoes?: Json | null
          cnpjs?: number | null
          consultas?: string[] | null
          consultas_extras?: Json | null
          contato?: string
          created_at?: string
          custo_api?: number | null
          data_deposito?: string | null
          data_golive?: string | null
          data_kickoff?: string | null
          email?: string
          faturamento?: number | null
          forma_pagamento?: string | null
          frequencia?: string | null
          gasto_diario_medio?: number | null
          id?: string
          nivel_dificuldade?: string | null
          nome?: string
          nome_plataforma?: string | null
          notas_automacao?: string | null
          product_id?: string
          rotina_conferencia?: Json | null
          saldo_anuncio?: number | null
          status?: string
          tipo_plataforma?: string | null
          updated_at?: string
          valor_contrato?: number | null
          whatsapp?: string
        }
        Relationships: []
      }
      crm_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          label: string
          position: number
        }
        Insert: {
          color?: string
          created_at?: string
          id: string
          label: string
          position?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: []
      }
      materials: {
        Row: {
          categoria: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          product_id: string | null
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          product_id?: string | null
          tipo?: string
          titulo: string
          url: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          product_id?: string | null
          tipo?: string
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      melhorias: {
        Row: {
          created_at: string
          id: string
          prioridade: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          prioridade?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          prioridade?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      planning_columns: {
        Row: {
          color: string
          created_at: string
          id: string
          label: string
          position: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          label: string
          position?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: []
      }
      planning_tasks: {
        Row: {
          assigned_to: string | null
          column_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          labels: string[] | null
          position: number
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          column_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[] | null
          position?: number
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          column_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[] | null
          position?: number
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "planning_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          config: Json | null
          created_at: string
          descricao: string
          icon: string
          id: string
          nome: string
          position: number
        }
        Insert: {
          config?: Json | null
          created_at?: string
          descricao?: string
          icon?: string
          id: string
          nome: string
          position?: number
        }
        Update: {
          config?: Json | null
          created_at?: string
          descricao?: string
          icon?: string
          id?: string
          nome?: string
          position?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          contato: string | null
          created_at: string
          data_contato: string | null
          data_followup: string | null
          email: string | null
          id: string
          nome: string
          notas: string | null
          origem: string | null
          product_id: string | null
          status: string
          updated_at: string
          valor_estimado: number | null
          whatsapp: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string
          data_contato?: string | null
          data_followup?: string | null
          email?: string | null
          id?: string
          nome: string
          notas?: string | null
          origem?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string
          data_contato?: string | null
          data_followup?: string | null
          email?: string | null
          id?: string
          nome?: string
          notas?: string | null
          origem?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
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
      get_username: { Args: { _user_id: string }; Returns: string }
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
