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
      caixas: {
        Row: {
          created_at: string | null
          data_abertura: string | null
          data_fechamento: string | null
          id: string
          observacoes: string | null
          operador_id: string | null
          quebra_de_caixa: number | null
          saldo_cartao: number | null
          saldo_dinheiro: number | null
          saldo_pix: number | null
          status: string | null
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          operador_id?: string | null
          quebra_de_caixa?: number | null
          saldo_cartao?: number | null
          saldo_dinheiro?: number | null
          saldo_pix?: number | null
          status?: string | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          created_at?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          id?: string
          observacoes?: string | null
          operador_id?: string | null
          quebra_de_caixa?: number | null
          saldo_cartao?: number | null
          saldo_dinheiro?: number | null
          saldo_pix?: number | null
          status?: string | null
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          ativo: boolean
          categoria_pai_id: string | null
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_pai_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_pai_id?: string | null
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_categoria_pai_id_fkey"
            columns: ["categoria_pai_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          bairro: string | null
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          id: string
          limite_credito: number | null
          nome: string
          observacoes: string | null
          saldo_devedor: number | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          limite_credito?: number | null
          nome: string
          observacoes?: string | null
          saldo_devedor?: number | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          limite_credito?: number | null
          nome?: string
          observacoes?: string | null
          saldo_devedor?: number | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conhecimento_loja: {
        Row: {
          categoria: string | null
          conteudo: string
          created_at: string | null
          id: string
        }
        Insert: {
          categoria?: string | null
          conteudo: string
          created_at?: string | null
          id?: string
        }
        Update: {
          categoria?: string | null
          conteudo?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          categoria: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          fornecedor_id: string | null
          id: string
          status: Database["public"]["Enums"]["status_despesa"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao: string
          fornecedor_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_despesa"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          fornecedor_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["status_despesa"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      formas_pagamento: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          taxa_percentual: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          taxa_percentual?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          taxa_percentual?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_venda: {
        Row: {
          created_at: string
          desconto_item: number
          id: string
          peso_liquido: number | null
          preco_unitario: number
          produto_id: string
          quantidade: number
          sequencia: number
          subtotal: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          desconto_item?: number
          id?: string
          peso_liquido?: number | null
          preco_unitario: number
          produto_id: string
          quantidade?: number
          sequencia: number
          subtotal: number
          venda_id: string
        }
        Update: {
          created_at?: string
          desconto_item?: number
          id?: string
          peso_liquido?: number | null
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          sequencia?: number
          subtotal?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_caixa: {
        Row: {
          caixa_id: string | null
          criado_em: string | null
          id: string
          motivo: string | null
          tipo: string
          usuario_responsavel: string | null
          valor: number
        }
        Insert: {
          caixa_id?: string | null
          criado_em?: string | null
          id?: string
          motivo?: string | null
          tipo: string
          usuario_responsavel?: string | null
          valor: number
        }
        Update: {
          caixa_id?: string | null
          criado_em?: string | null
          id?: string
          motivo?: string | null
          tipo?: string
          usuario_responsavel?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          estoque_anterior: number
          estoque_novo: number
          id: string
          motivo: string | null
          produto_id: string
          quantidade: number
          tipo: string
          venda_id: string | null
        }
        Insert: {
          created_at?: string
          estoque_anterior: number
          estoque_novo: number
          id?: string
          motivo?: string | null
          produto_id: string
          quantidade: number
          tipo: string
          venda_id?: string | null
        }
        Update: {
          created_at?: string
          estoque_anterior?: number
          estoque_novo?: number
          id?: string
          motivo?: string | null
          produto_id?: string
          quantidade?: number
          tipo?: string
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_estoque_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      precos_historico: {
        Row: {
          created_at: string
          data_alteracao: string
          id: string
          motivo: string | null
          preco_anterior: number
          preco_novo: number
          produto_id: string
        }
        Insert: {
          created_at?: string
          data_alteracao?: string
          id?: string
          motivo?: string | null
          preco_anterior: number
          preco_novo: number
          produto_id: string
        }
        Update: {
          created_at?: string
          data_alteracao?: string
          id?: string
          motivo?: string | null
          preco_anterior?: number
          preco_novo?: number
          produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "precos_historico_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          codigo_barras: string | null
          created_at: string
          eh_caixa: boolean | null
          em_vitrine: boolean | null
          estoque_atual: number | null
          estoque_minimo: number
          fornecedor_id: string | null
          id: string
          imagem_url: string | null
          margem_lucro: number | null
          margem_perda: number | null
          nome: string
          perecivel: boolean
          peso_caixa: number | null
          preco_custo: number | null
          preco_kg: number | null
          preco_oferta: number | null
          preco_unidade: number | null
          quantidade_disponivel: number
          quantidade_minima: number
          tipo_venda: Database["public"]["Enums"]["tipo_venda"]
          updated_at: string
          validade: string | null
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string
          eh_caixa?: boolean | null
          em_vitrine?: boolean | null
          estoque_atual?: number | null
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          imagem_url?: string | null
          margem_lucro?: number | null
          margem_perda?: number | null
          nome: string
          perecivel?: boolean
          peso_caixa?: number | null
          preco_custo?: number | null
          preco_kg?: number | null
          preco_oferta?: number | null
          preco_unidade?: number | null
          quantidade_disponivel?: number
          quantidade_minima?: number
          tipo_venda?: Database["public"]["Enums"]["tipo_venda"]
          updated_at?: string
          validade?: string | null
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          codigo_barras?: string | null
          created_at?: string
          eh_caixa?: boolean | null
          em_vitrine?: boolean | null
          estoque_atual?: number | null
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          imagem_url?: string | null
          margem_lucro?: number | null
          margem_perda?: number | null
          nome?: string
          perecivel?: boolean
          peso_caixa?: number | null
          preco_custo?: number | null
          preco_kg?: number | null
          preco_oferta?: number | null
          preco_unidade?: number | null
          quantidade_disponivel?: number
          quantidade_minima?: number
          tipo_venda?: Database["public"]["Enums"]["tipo_venda"]
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id: string
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          updated_at?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          caixa_id: string | null
          cliente_id: string | null
          created_at: string
          cupom_impresso: boolean
          data_hora: string
          desconto: number
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          numero_venda: number
          observacoes: string | null
          operador_id: string | null
          sincronizado: boolean
          status: Database["public"]["Enums"]["status_venda"]
          subtotal: number
          total: number
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          caixa_id?: string | null
          cliente_id?: string | null
          created_at?: string
          cupom_impresso?: boolean
          data_hora?: string
          desconto?: number
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          numero_venda?: number
          observacoes?: string | null
          operador_id?: string | null
          sincronizado?: boolean
          status?: Database["public"]["Enums"]["status_venda"]
          subtotal?: number
          total?: number
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          caixa_id?: string | null
          cliente_id?: string | null
          created_at?: string
          cupom_impresso?: boolean
          data_hora?: string
          desconto?: number
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          numero_venda?: number
          observacoes?: string | null
          operador_id?: string | null
          sincronizado?: boolean
          status?: Database["public"]["Enums"]["status_venda"]
          subtotal?: number
          total?: number
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendas_caixa"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_pagamentos: {
        Row: {
          created_at: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      vitrine_conteudo: {
        Row: {
          ativo: boolean | null
          copywriting: string | null
          created_at: string
          id: string
          slogan: string | null
          tema_visual: string | null
          titulo: string | null
        }
        Insert: {
          ativo?: boolean | null
          copywriting?: string | null
          created_at?: string
          id?: string
          slogan?: string | null
          tema_visual?: string | null
          titulo?: string | null
        }
        Update: {
          ativo?: boolean | null
          copywriting?: string | null
          created_at?: string
          id?: string
          slogan?: string | null
          tema_visual?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abrir_caixa: {
        Args: { p_operador_id: string; p_valor_inicial: number }
        Returns: string
      }
      decrementar_estoque: {
        Args: { p_produto_id: string; p_quantidade: number }
        Returns: undefined
      }
      execute_sql: { Args: { query: string }; Returns: Json }
      execute_sql_query: { Args: { query_text: string }; Returns: Json }
      fechar_caixa: {
        Args: {
          p_caixa_id: string
          p_quebra?: number
          p_valor_final_informado: number
        }
        Returns: undefined
      }
      get_produtos_estoque_baixo: {
        Args: never
        Returns: {
          ativo: boolean
          categoria_id: string | null
          codigo_barras: string | null
          created_at: string
          eh_caixa: boolean | null
          em_vitrine: boolean | null
          estoque_atual: number | null
          estoque_minimo: number
          fornecedor_id: string | null
          id: string
          imagem_url: string | null
          margem_lucro: number | null
          margem_perda: number | null
          nome: string
          perecivel: boolean
          peso_caixa: number | null
          preco_custo: number | null
          preco_kg: number | null
          preco_oferta: number | null
          preco_unidade: number | null
          quantidade_disponivel: number
          quantidade_minima: number
          tipo_venda: Database["public"]["Enums"]["tipo_venda"]
          updated_at: string
          validade: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "produtos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_relatorio_fechamento: { Args: { p_caixa_id: string }; Returns: Json }
      marcar_venda_impressa: {
        Args: { p_venda_id: string }
        Returns: undefined
      }
      movimentar_caixa: {
        Args: {
          p_caixa_id: string
          p_motivo: string
          p_tipo: string
          p_usuario_id: string
          p_valor: number
        }
        Returns: undefined
      }
      processar_venda_completa:
        | { Args: { p_itens: Json; p_venda: Json }; Returns: Json }
        | {
            Args: { p_itens: Json; p_pagamentos?: Json; p_venda: Json }
            Returns: Json
          }
    }
    Enums: {
      forma_pagamento: "dinheiro" | "debito" | "credito" | "pix" | "multiplo"
      forma_pagamento_venda: "dinheiro" | "debito" | "credito" | "pix"
      perfil_usuario: "admin" | "vendedor" | "estoquista"
      status_caixa: "aberto" | "fechado"
      status_despesa: "pago" | "pendente"
      status_venda: "aberta" | "finalizada" | "cancelada"
      tipo_venda: "peso" | "unidade" | "hibrido"
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
      forma_pagamento: ["dinheiro", "debito", "credito", "pix", "multiplo"],
      forma_pagamento_venda: ["dinheiro", "debito", "credito", "pix"],
      perfil_usuario: ["admin", "vendedor", "estoquista"],
      status_caixa: ["aberto", "fechado"],
      status_despesa: ["pago", "pendente"],
      status_venda: ["aberta", "finalizada", "cancelada"],
      tipo_venda: ["peso", "unidade", "hibrido"],
    },
  },
} as const
