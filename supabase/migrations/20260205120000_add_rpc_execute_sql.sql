-- SECURITY: Removed execute_sql_query function to prevent SQL injection risks.
-- This function allowed arbitrary SQL execution which is a major security vulnerability.
-- Use specific RPC functions for each database operation instead.

-- The function was previously defined as:
-- CREATE OR REPLACE FUNCTION public.execute_sql_query(query_text TEXT)
-- But has been removed for security reasons.

-- TODO: Create specific RPC functions for:
-- - get_vendas_resumo (SELECT)
-- - get_produtos_estoque (SELECT)
-- - update_estoque (UPDATE)
-- - insert_venda (INSERT)
-- - insert_movimentacao (INSERT)
