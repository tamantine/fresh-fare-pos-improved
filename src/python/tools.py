from datetime import datetime, timedelta
from supabase_client import get_supabase

# --- FERRAMENTAS DE CONSULTA E AÇÃO ---

def get_vendas_resumo(periodo: str = "hoje"):
    """
    Obtém um resumo das vendas para um determinado período.
    Args:
        periodo: "hoje", "ontem", "semana", "mes"
    """
    sb = get_supabase()
    if not sb:
        return "Erro: Falha na conexão com banco de dados."

    now = datetime.now()
    
    if periodo == "hoje":
        start_date = now.strftime("%Y-%m-%d")
    elif periodo == "ontem":
        start_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    elif periodo == "semana":
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    elif periodo == "mes":
        start_date = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    else:
        return f"Período '{periodo}' desconhecido. Use hoje, ontem, semana ou mes."

    # Query no Supabase
    try:
        # Busca vendas finalizadas no periodo
        response = sb.table("vendas") \
            .select("total, forma_pagamento, status") \
            .eq("status", "finalizada") \
            .gte("created_at", f"{start_date}T00:00:00") \
            .execute()
        
        vendas = response.data
        if not vendas:
            return f"Nenhuma venda encontrada para o período: {periodo}."

        total_valor = sum([v['total'] for v in vendas])
        qtd_vendas = len(vendas)
        ticket_medio = total_valor / qtd_vendas if qtd_vendas > 0 else 0

        # Agrupamento por pagamento
        pagamentos = {}
        for v in vendas:
            forma = v.get('forma_pagamento') or 'desconhecido'
            pagamentos[forma] = pagamentos.get(forma, 0) + v['total']

        resumo_pag = ", ".join([f"{k}: R$ {v:.2f}" for k, v in pagamentos.items()])

        return (
            f"**Resumo de Vendas ({periodo})**\n"
            f"- Total Vendido: R$ {total_valor:.2f}\n"
            f"- Qtd Vendas: {qtd_vendas}\n"
            f"- Ticket Medio: R$ {ticket_medio:.2f}\n"
            f"- Por Forma de Pagamento: {resumo_pag}"
        )

    except Exception as e:
        return f"Erro ao consultar vendas: {str(e)}"

def check_stock(produto_nome: str):
    """
    Verifica o estoque de um produto pelo nome ou código.
    """
    sb = get_supabase()
    if not sb: return "Erro de conexão."

    try:
        # Busca por nome (ilike) ou codigo de barras
        # Supabase Python SDK não tem 'or' complexo fácil numa linha só as vezes, vamos tentar query direta ou filtro
        # Vamos buscar por nome generico
        response = sb.table("produtos") \
            .select("nome, estoque_atual, preco_unidade, preco_kg, tipo_venda, codigo_barras") \
            .ilike("nome", f"%{produto_nome}%") \
            .eq("ativo", True) \
            .limit(5) \
            .execute()

        produtos = response.data
        if not produtos:
            return f"Não encontrei nenhum produto com o nome '{produto_nome}'."

        respostas = []
        for p in produtos:
            preco = p['preco_kg'] if p['tipo_venda'] == 'peso' else p['preco_unidade']
            unidade = 'kg' if p['tipo_venda'] == 'peso' else 'un'
            respostas.append(f"- {p['nome']} (Cod: {p['codigo_barras']}): {p['estoque_atual']} {unidade} em estoque. Preço: R$ {preco:.2f}")

        return "\n".join(respostas)

    except Exception as e:
        return f"Erro ao buscar produto: {str(e)}"

# Dicionário de Ferramentas disponíveis para o Agente (Mapping)
TOOL_MAP = {
    'get_vendas_resumo': get_vendas_resumo,
    'check_stock': check_stock
}
