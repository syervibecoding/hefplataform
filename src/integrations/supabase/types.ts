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
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cash_expenses: {
        Row: {
          aliases: string[]
          ativo: boolean
          categoria: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          dia_pagamento: number
          id: string
          nome: string
          recorrencia: string
          ultimo_dia_util: boolean
          updated_at: string
          valor: number
        }
        Insert: {
          aliases?: string[]
          ativo?: boolean
          categoria?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_pagamento?: number
          id?: string
          nome: string
          recorrencia?: string
          ultimo_dia_util?: boolean
          updated_at?: string
          valor?: number
        }
        Update: {
          aliases?: string[]
          ativo?: boolean
          categoria?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_pagamento?: number
          id?: string
          nome?: string
          recorrencia?: string
          ultimo_dia_util?: boolean
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      cash_month_snapshots: {
        Row: {
          ano: number
          categoria: string | null
          created_at: string
          data: string
          dia_pagamento: number | null
          id: string
          mes: number
          nome: string
          origem_id: string
          origem_tipo: string
          sub_kind: string
          tipo: string
          valor: number
        }
        Insert: {
          ano: number
          categoria?: string | null
          created_at?: string
          data: string
          dia_pagamento?: number | null
          id?: string
          mes: number
          nome: string
          origem_id: string
          origem_tipo: string
          sub_kind?: string
          tipo: string
          valor?: number
        }
        Update: {
          ano?: number
          categoria?: string | null
          created_at?: string
          data?: string
          dia_pagamento?: number | null
          id?: string
          mes?: number
          nome?: string
          origem_id?: string
          origem_tipo?: string
          sub_kind?: string
          tipo?: string
          valor?: number
        }
        Relationships: []
      }
      cash_overrides: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          id: string
          import_id: string | null
          nome: string
          origem_id: string | null
          origem_tipo: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data: string
          id?: string
          import_id?: string | null
          nome: string
          origem_id?: string | null
          origem_tipo?: string | null
          tipo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          id?: string
          import_id?: string | null
          nome?: string
          origem_id?: string | null
          origem_tipo?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_overrides_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "financial_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_settings: {
        Row: {
          data_saldo_inicial: string
          id: string
          saldo_inicial: number
          updated_at: string
        }
        Insert: {
          data_saldo_inicial?: string
          id?: string
          saldo_inicial?: number
          updated_at?: string
        }
        Update: {
          data_saldo_inicial?: string
          id?: string
          saldo_inicial?: number
          updated_at?: string
        }
        Relationships: []
      }
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
      client_interactions: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          data: string
          descricao: string | null
          id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          data: string
          descricao?: string | null
          id?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
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
          data_implementacao: string | null
          data_inicio: string | null
          data_kickoff: string | null
          dia_pagamento: number
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
          support_enabled: boolean
          support_slug: string | null
          tem_mensalidade: boolean | null
          tipo_plataforma: string | null
          updated_at: string
          valor_contrato: number | null
          valor_implementacao: number | null
          valor_mensalidade: number | null
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
          data_implementacao?: string | null
          data_inicio?: string | null
          data_kickoff?: string | null
          dia_pagamento?: number
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
          support_enabled?: boolean
          support_slug?: string | null
          tem_mensalidade?: boolean | null
          tipo_plataforma?: string | null
          updated_at?: string
          valor_contrato?: number | null
          valor_implementacao?: number | null
          valor_mensalidade?: number | null
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
          data_implementacao?: string | null
          data_inicio?: string | null
          data_kickoff?: string | null
          dia_pagamento?: number
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
          support_enabled?: boolean
          support_slug?: string | null
          tem_mensalidade?: boolean | null
          tipo_plataforma?: string | null
          updated_at?: string
          valor_contrato?: number | null
          valor_implementacao?: number | null
          valor_mensalidade?: number | null
          whatsapp?: string
        }
        Relationships: []
      }
      consultants: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: []
      }
      consultoria_slots: {
        Row: {
          client_id: string
          consultant_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          dia_semana: number
          id: string
          turno: string
        }
        Insert: {
          client_id: string
          consultant_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dia_semana: number
          id?: string
          turno: string
        }
        Update: {
          client_id?: string
          consultant_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          dia_semana?: number
          id?: string
          turno?: string
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
      financial_imports: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          period_end: string | null
          period_start: string | null
          source_name: string
          transactions_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          period_end?: string | null
          period_start?: string | null
          source_name: string
          transactions_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          period_end?: string | null
          period_start?: string | null
          source_name?: string
          transactions_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      investment_transactions: {
        Row: {
          created_at: string
          data: string
          id: string
          investment_id: string
          notas: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          investment_id: string
          notas?: string | null
          tipo?: string
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          investment_id?: string
          notas?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          ativo: boolean
          created_at: string
          data_inicial: string
          id: string
          instituicao: string | null
          liquidez: string
          nome: string
          notas: string | null
          rendimento_anual: number
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          data_inicial?: string
          id?: string
          instituicao?: string | null
          liquidez?: string
          nome: string
          notas?: string | null
          rendimento_anual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          data_inicial?: string
          id?: string
          instituicao?: string | null
          liquidez?: string
          nome?: string
          notas?: string | null
          rendimento_anual?: number
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      lovable_product_clients: {
        Row: {
          client_id: string
          created_at: string
          data_replicacao: string | null
          notas: string | null
          product_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data_replicacao?: string | null
          notas?: string | null
          product_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data_replicacao?: string | null
          notas?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lovable_product_clients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lovable_products"
            referencedColumns: ["id"]
          },
        ]
      }
      lovable_products: {
        Row: {
          categoria: string | null
          cliente_origem_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          links: Json
          nome: string
          stack: string[] | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          url_app: string | null
          video_demo_url: string | null
        }
        Insert: {
          categoria?: string | null
          cliente_origem_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          links?: Json
          nome: string
          stack?: string[] | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          url_app?: string | null
          video_demo_url?: string | null
        }
        Update: {
          categoria?: string | null
          cliente_origem_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          links?: Json
          nome?: string
          stack?: string[] | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          url_app?: string | null
          video_demo_url?: string | null
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
      platform_companies: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_company_products: {
        Row: {
          company_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_company_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lovable_products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          notas: string | null
          product_id: string
          senha: string | null
          updated_at: string
          usuario: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          notas?: string | null
          product_id: string
          senha?: string | null
          updated_at?: string
          usuario?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          notas?: string | null
          product_id?: string
          senha?: string | null
          updated_at?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_credentials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lovable_products"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_files: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          mime_type: string | null
          nome: string
          product_id: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          mime_type?: string | null
          nome: string
          product_id: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          mime_type?: string | null
          nome?: string
          product_id?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lovable_products"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_rate_limits: {
        Row: {
          action: string
          count: number
          slug: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          slug: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          slug?: string
          window_start?: string
        }
        Relationships: []
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
          client_id: string | null
          created_at: string
          display_name: string | null
          id: string
          platform_company_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          platform_company_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          platform_company_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_platform_company_id_fkey"
            columns: ["platform_company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies"
            referencedColumns: ["id"]
          },
        ]
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
      renewal_pipeline: {
        Row: {
          client_id: string
          created_at: string
          data_vencimento: string | null
          id: string
          notas: string | null
          status: string
          updated_at: string
          valor_renovacao: number | null
        }
        Insert: {
          client_id: string
          created_at?: string
          data_vencimento?: string | null
          id?: string
          notas?: string | null
          status?: string
          updated_at?: string
          valor_renovacao?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string
          data_vencimento?: string | null
          id?: string
          notas?: string | null
          status?: string
          updated_at?: string
          valor_renovacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      result_allocations: {
        Row: {
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          percentual: number
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          percentual?: number
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          percentual?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          message_id: string | null
          mime_type: string
          size_bytes: number
          ticket_id: string
          uploaded_by_name: string | null
          uploaded_by_type: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          message_id?: string | null
          mime_type: string
          size_bytes: number
          ticket_id: string
          uploaded_by_name?: string | null
          uploaded_by_type: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          message_id?: string | null
          mime_type?: string
          size_bytes?: number
          ticket_id?: string
          uploaded_by_name?: string | null
          uploaded_by_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_name: string | null
          author_type: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_name?: string | null
          author_type: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_name?: string | null
          author_type?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          categoria: string
          client_id: string | null
          closed_at: string | null
          created_at: string
          csat_comment: string | null
          csat_rating: number | null
          descricao: string
          first_response_at: string | null
          id: string
          last_client_read_at: string | null
          last_team_read_at: string | null
          opened_at: string
          platform_company_id: string | null
          prioridade: string
          product_id: string | null
          resolved_at: string | null
          status: string
          submitted_by_email: string | null
          submitted_by_name: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          csat_comment?: string | null
          csat_rating?: number | null
          descricao: string
          first_response_at?: string | null
          id?: string
          last_client_read_at?: string | null
          last_team_read_at?: string | null
          opened_at?: string
          platform_company_id?: string | null
          prioridade?: string
          product_id?: string | null
          resolved_at?: string | null
          status?: string
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          csat_comment?: string | null
          csat_rating?: number | null
          descricao?: string
          first_response_at?: string | null
          id?: string
          last_client_read_at?: string | null
          last_team_read_at?: string | null
          opened_at?: string
          platform_company_id?: string | null
          prioridade?: string
          product_id?: string | null
          resolved_at?: string | null
          status?: string
          submitted_by_email?: string | null
          submitted_by_name?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_platform_company_id_fkey"
            columns: ["platform_company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lovable_products"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rate_history: {
        Row: {
          aliquota: number
          created_at: string
          id: string
          vigente_desde: string
        }
        Insert: {
          aliquota: number
          created_at?: string
          id?: string
          vigente_desde: string
        }
        Update: {
          aliquota?: number
          created_at?: string
          id?: string
          vigente_desde?: string
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
      client_has_product: { Args: { _product_id: string }; Returns: boolean }
      get_my_client_id: { Args: never; Returns: string }
      get_my_platform_company_id: { Args: never; Returns: string }
      get_username: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal_team: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "coordenador" | "cliente"
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
      app_role: ["admin", "user", "coordenador", "cliente"],
    },
  },
} as const
