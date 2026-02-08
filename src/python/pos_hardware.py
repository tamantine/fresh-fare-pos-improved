import os
import sys
import json
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from escpos.printer import Usb
from escpos.exceptions import USBNotFoundError

# Carregar variáveis de ambiente
# O .env está na raiz do projeto (../../.env em relação a este script)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(env_path)

# Configurações do Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") # Frontend usa VITE_, backend tenta ler o mesmo ou normal
if not SUPABASE_URL:
    SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
if not SUPABASE_KEY:
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

SUPABASE_USER_TOKEN = os.getenv("SUPABASE_USER_TOKEN") # Opcional

# Lista de VIDs e PIDs comuns de impressoras térmicas (Exemplos: Epson, Bematech, Genéricos)
# Formato: (idVendor, idProduct)
KNOWN_PRINTERS = [
    (0x04b8, 0x0202), # Epson TM-T20
    (0x04b8, 0x0e15), # Epson TM-T20II
    (0x1504, 0x0006), # Generic POS-58
    (0x0dd4, 0x015d), # Bematech
    # Adicione mais pares conforme necessário
]

def setup_supabase() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Erro: Credenciais do Supabase não encontradas no .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)

class DummyPrinter:
    """Impressora simulada para testes sem hardware."""
    def text(self, txt):
        print(f"[SIMULAÇÃO IMPRESSORA]: {txt}", end='')
    
    def set(self, **kwargs):
        pass
        
    def cut(self):
        print("[SIMULAÇÃO IMPRESSORA]: --- CORTE DE PAPEL ---")

def detectar_impressora_usb(simular=False):
    """
    Tenta detectar automaticamente uma impressora USB conectada
    baseada em uma lista de VIDs/PIDS conhecidos.
    """
    if simular:
        print("Modo de simulação ativado. Usando impressora virtual.")
        return DummyPrinter()

    print("Iniciando detecção de impressora USB...")
    
    # Tenta conectar em impressoras conhecidas
    for vid, pid in KNOWN_PRINTERS:
        try:
            printer = Usb(vid, pid, timeout=5000) # Timeout curto para verificar
            print(f"Impressora detectada: VID={hex(vid)}, PID={hex(pid)}")
            return printer
        except USBNotFoundError:
            continue
        except Exception as e:
            print(f"Erro ao tentar conectar VID={hex(vid)} PID={hex(pid)}: {e}")
            continue
            
    print("Nenhuma impressora conhecida detectada.")
    return None

# ... (rest of the file until finalize_venda)

if __name__ == "__main__":
    # Argumentos
    simular = '--simulate' in sys.argv
    detectar_apenas = 'detect' in sys.argv
    
    # Se chamado com argumento 'detect', apenas detecta
    if detectar_apenas:
        imp = detectar_impressora_usb(simular=simular)
        if imp:
            print("Impressora encontrada e pronta.")
            sys.exit(0)
        else:
            sys.exit(1)
            
    # Exemplo de uso para teste
    exemplo_venda = {
        "total": 50.00,
        "metodo_pagamento": "pix",
        "itens": [
            {"id": 1, "nome": "Banana Prata", "quantidade": 1.5, "unidade": "KG", "preco_unitario": 10.00},
            {"id": 2, "nome": "Maca Fuji", "quantidade": 2, "unidade": "KG", "preco_unitario": 15.00},
            {"id": 3, "nome": "Sacola", "quantidade": 1, "unidade": "UN", "preco_unitario": 5.00},
        ]
    }
    
    # Se não for apenas detecção e tiver argumento de teste, roda venda simulada
    if '--test-sale' in sys.argv:
        print("Rodando teste de venda...")
        res = finalizar_venda(exemplo_venda, simular=simular)
        print(f"Resultado: {res}")
    else:
        print("Uso: python pos_hardware.py [detect] [--simulate] [--test-sale]")

def gerar_cupom_nao_fiscal(printer, dados_venda):
    """
    Gera e imprime o cupom não fiscal.
    """
    if not printer:
        print("Erro: Impressora não inicializada para impressão.")
        return

    try:
        # Cabeçalho
        printer.set(align='center', font='a', width=1, height=1)
        printer.text("Hortifruti Bom Preço\n")
        printer.text("Salto de Pirapora, SP\n")
        printer.text("--------------------------------\n")
        printer.text("CUPOM NAO FISCAL\n")
        printer.text(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        printer.text("--------------------------------\n")
        
        # Corpo - Itens
        printer.set(align='left')
        printer.text(f"{'Item':<16} {'Qtd':<5} {'Un':<3} {'Total':>6}\n")
        
        total_geral = 0
        for item in dados_venda.get('itens', []):
            nome = item.get('nome', 'Item sem nome')[:16] # Trunca nome
            qtd = item.get('quantidade', 0)
            un = item.get('unidade', 'UN')
            preco = item.get('preco_unitario', 0)
            total_item = qtd * preco
            total_geral += total_item
            
            printer.text(f"{nome:<16} {qtd:<5} {un:<3} {total_item:>6.2f}\n")
            
        printer.text("--------------------------------\n")
        
        # Totais
        printer.set(align='right', width=2, height=1)
        printer.text(f"TOTAL: R$ {total_geral:.2f}\n")
        
        # Rodapé
        printer.set(align='center', width=1, height=1, font='b')
        printer.text("\nObrigado pela preferencia!\n")
        printer.text("\n\n")
        
        # Cortar papel
        printer.cut()
        
        print("Impressão concluída com sucesso.")
        
    except Exception as e:
        print(f"Erro durante a impressão: {e}")

def finalizar_venda(dados_venda, simular=False):
    """
    Orquestra o fluxo de finalizar a venda:
    1. Gravar no Supabase
    2. Atualizar Estoque
    3. Imprimir
    """
    supabase = setup_supabase()
    
    print(f"Iniciando finalização de venda... (Simulação: {simular})")
    
    # 1. Tentar detectar impressora
    printer = detectar_impressora_usb(simular=simular)
    if not printer:
        msg = "Impressora não detectada. Verifique o cabo USB e clique em Reconhecer."
        print(msg)
        return {"sucesso": False, "mensagem": msg}

    try:
        # Iniciando transação ou inserções
        # Supabase não tem transações multi-tabela via API simples, faremos sequencial
        # Idealmente usaríamos uma RPC (Stored Procedure) no banco para garantir atomicidade.
        # Aqui, faremos via código conforme solicitado.
        
        # 2. Gravar Venda
        venda_payload = {
            "data_venda": datetime.now().isoformat(),
            "total": dados_venda.get('total'),
            "metodo_pagamento": dados_venda.get('metodo_pagamento', 'dinheiro'),
            # Adicione outros campos necessários pela sua tabela 'vendas'
        }
        
        res_venda = supabase.table('vendas').insert(venda_payload).execute()
        
        if not res_venda.data:
            raise Exception("Falha ao gravar venda no Supabase.")
        
        venda_id = res_venda.data[0].get('id')
        print(f"Venda gravada com ID: {venda_id}")

        # 3. Gravar Itens e Atualizar Estoque
        itens_venda = []
        for item in dados_venda.get('itens', []):
            # Inserir item da venda
            itens_venda.append({
                "venda_id": venda_id,
                "produto_id": item.get('id'),
                "quantidade": item.get('quantidade'),
                "preco_unitario": item.get('preco_unitario')
            })
            
            # Decrementar Estoque
            # Nota: Isso é um ponto crítico. Se falhar, o estoque fica errado.
            # Recomendado: Usar uma RPC 'decrementar_estoque' no Supabase.
            # Vou fazer a chamada direta aqui mas deixo o aviso.
            
            # Buscando estoque atual (opcional, ou usar RPC) e decrementando
            # Para simplificar e seguir requisito: "Decremento de estoque na tabela produtos"
            # Vamos assumir uma RPC call seria o ideal, mas vamos tentar update direto se tiverpermissão
            # res_estoque = supabase.rpc('decrementar_estoque', {'p_id': item['id'], 'qtd': item['quantidade']}).execute()
            
            # Abordagem via UPDATE direto (menos seguro p/ concorrência)
            # Primeiro lê o atual (para evitar valores negativos cegos)
            prod_atual = supabase.table('produtos').select('estoque').eq('id', item.get('id')).single().execute()
            if prod_atual.data:
                novo_estoque = prod_atual.data['estoque'] - item.get('quantidade')
                supabase.table('produtos').update({'estoque': novo_estoque}).eq('id', item.get('id')).execute()

        # Gravar itens na tabela de junção (se existir tabela itens_venda)
        if itens_venda:
             supabase.table('itens_venda').insert(itens_venda).execute()
        
        print("Venda e estoque atualizados no Supabase.")
        
        # 4. Imprimir Cupom
        gerar_cupom_nao_fiscal(printer, dados_venda)
        
        return {"sucesso": True, "mensagem": "Venda realizada e impressa com sucesso!"}

    except Exception as e:
        print(f"Erro crítico ao finalizar venda: {e}")
        # Aqui seria ideal implementar rollback manual se algo falhou no meio do caminho
        return {"sucesso": False, "mensagem": f"Erro: {str(e)}"}

if __name__ == "__main__":
    # Exemplo de uso para teste
    # Simula dados vindos do frontend
    exemplo_venda = {
        "total": 50.00,
        "metodo_pagamento": "pix",
        "itens": [
            {"id": 1, "nome": "Banana Prata", "quantidade": 1.5, "unidade": "KG", "preco_unitario": 10.00},
            {"id": 2, "nome": "Maca Fuji", "quantidade": 2, "unidade": "KG", "preco_unitario": 15.00},
            {"id": 3, "nome": "Sacola", "quantidade": 1, "unidade": "UN", "preco_unitario": 5.00},
        ]
    }
    
    # Se chamado com argumento 'detect', apenas detecta
    if len(sys.argv) > 1 and sys.argv[1] == 'detect':
        imp = detectar_impressora_usb()
        if imp:
            print("Impressora encontrada e pronta.")
            sys.exit(0)
        else:
            sys.exit(1)
            
    # Executa fluxo completo de teste
    # finalizar_venda(exemplo_venda)
    print("Script pronto para uso. Chame as funções conforme necessário.")
