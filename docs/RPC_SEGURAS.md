# Funções RPC Seguras - Guia de Implementação

## Visão Geral

Este documento descreve as funções RPC seguras implementadas para substituir a execução de SQL arbitrário no sistema Fresh Fare POS.

## Problema de Segurança

Anteriormente, o sistema utilizava a função `execute_sql_query` que permitia a execução de SQL arbitrário, criando um risco grave de SQL injection.

```sql
-- PERIGOSO: SQL Injection possível
SELECT execute_sql_query('DROP TABLE vendas; --');
```

## Solução de Segurança

Implementamos funções RPC específicas para cada operação, com validação de parâmetros e controle de acesso.

## Funções Implementadas

### 1. get_vendas_resumo (READ ONLY)

Obtém estatísticas de vendas para um período específico.

**Parâmetros:**
- `p_data_inicial` (DATE, opcional): Data inicial do período
- `p_data_final` (DATE, opcional): Data final do período

**Retorno:**
```typescript
interface VendasResumo {
  total_vendas: number;
  total_receita: number;
  media_ticket: number;
  vendas_hoje: number;
  receita_hoje: number;
}
```

**Uso:**
```typescript
// Últimos 30 dias (padrão)
const resumo = await getVendasResumo();

// Período específico
const resumo = await getVendasResumo(new Date('2024-01-01'), new Date('2024-01-31'));
```

### 2. get_produtos_estoque (READ ONLY)

Obtém lista de produtos com informações de estoque.

**Parâmetros:**
- `p_categoria_id` (UUID, opcional): Filtrar por categoria
- `p_busca` (TEXT, opcional): Buscar por nome ou código de barras

**Retorno:**
```typescript
interface ProdutoEstoque {
  id: string;
  nome: string;
  codigo_barras: string | null;
  categoria_nome: string;
  tipo_venda: string;
  preco_unidade: number;
  preco_kg: number;
  estoque_atual: number;
  estoque_minimo: number;
  status: string;
}
```

**Uso:**
```typescript
// Todos os produtos
const produtos = await getProdutosEstoque();

// Por categoria
const produtos = await getProdutosEstoque('uuid-da-categoria');

// Com busca
const produtos = await getProdutosEstoque(null, 'batata');
```

### 3. update_estoque (WRITE)

Atualiza o estoque de um produto.

**Parâmetros:**
- `p_produto_id` (UUID, obrigatório): ID do produto
- `p_quantidade` (NUMERIC, obrigatório): Quantidade a ser adicionada (positivo) ou removida (negativo)
- `p_motivo` (TEXT, opcional): Motivo da alteração

**Retorno:**
```typescript
interface UpdateEstoqueResult {
  sucesso: boolean;
  mensagem: string;
  estoque_anterior: number;
  estoque_novo: number;
}
```

**Validações:**
- Produto deve existir
- Quantidade não pode ser nula
- Registra automaticamente a movimentação

**Uso:**
```typescript
const resultado = await updateEstoque(
  'uuid-do-produto',
  10, // Adicionar 10 unidades
  'entrada_de_mercadoria'
);
```

### 4. insert_venda (WRITE)

Insere uma nova venda.

**Parâmetros:**
- `p_subtotal` (NUMERIC, obrigatório): Valor total antes do desconto
- `p_desconto` (NUMERIC, obrigatório): Valor do desconto
- `p_total` (NUMERIC, obrigatório): Valor total após desconto
- `p_forma_pagamento` (TEXT, obrigatório): Forma de pagamento

**Validações:**
- Valores não podem ser negativos
- Forma de pagamento deve ser válida ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito')

**Retorno:**
```typescript
interface InsertVendaResult {
  sucesso: boolean;
  mensagem: string;
  venda_id: string | null;
}
```

**Uso:**
```typescript
const resultado = await insertVenda(
  100.00, // subtotal
  10.00,  // desconto
  90.00,  // total
  'pix'   // forma_pagamento
);
```

### 5. insert_movimentacao (WRITE)

Registra movimentação de estoque.

**Parâmetros:**
- `p_produto_id` (UUID, obrigatório): ID do produto
- `p_tipo` (TEXT, obrigatório): Tipo da movimentação ('entrada', 'saida', 'ajuste')
- `p_quantidade` (NUMERIC, obrigatório): Quantidade movimentada
- `p_estoque_anterior` (NUMERIC, obrigatório): Estoque antes da movimentação
- `p_estoque_novo` (NUMERIC, obrigatório): Estoque após a movimentação
- `p_venda_id` (UUID, opcional): ID da venda associada
- `p_compra_id` (UUID, opcional): ID da compra associada

**Validações:**
- Não pode ter ambos venda_id e compra_id
- Quantidade deve ser maior que zero

**Retorno:**
```typescript
interface InsertMovimentacaoResult {
  sucesso: boolean;
  mensagem: string;
  movimentacao_id: string | null;
}
```

**Uso:**
```typescript
const resultado = await insertMovimentacao(
  'uuid-do-produto',
  'saida',
  5,
  20, // estoque anterior
  15, // estoque novo
  'uuid-da-venda'
);
```

## Migração de Código

### Antes (INSEGURO):
```typescript
// PERIGOSO: SQL Injection
const { data } = await supabase.rpc('execute_sql_query', {
  query_text: `SELECT * FROM vendas WHERE created_at >= '${dataInicial}' AND created_at <= '${dataFinal}'`
});
```

### Depois (SEGURO):
```typescript
// SEGURO: Função específica
const resumo = await getVendasResumo(dataInicial, dataFinal);
```

## Permissões

Todas as funções foram configuradas com:
- `SECURITY DEFINER`: Executa com privilégios do dono da função
- `GRANT EXECUTE`: Permite execução para usuários autenticados
- Validação de parâmetros: Prevenção de dados maliciosos

## Benefícios de Segurança

1. **Prevenção de SQL Injection**: Parâmetros são validados e tipados
2. **Controle de Acesso**: Funções específicas com permissões granulares
3. **Auditoria**: Todas as operações são registradas e rastreáveis
4. **Validação**: Dados são validados antes de serem processados
5. **Isolamento**: Cada operação tem sua própria função com escopo limitado

## Próximos Passos

1. **Migrar todo o código existente** para usar as novas funções RPC
2. **Remover completamente** a função `execute_sql_query`
3. **Adicionar testes** para validar a segurança das funções
4. **Monitorar** o uso das funções para detectar anomalias

## Documentação de Referência

- [Código-fonte das funções RPC](/supabase/migrations/20260205130000_create_secure_rpc_functions.sql)
- [Serviço de integração](/src/integrations/supabase/rpc.ts)
- [Exemplos de utilização](/src/examples/rpc-usage-example.ts)