from agent import ProfessionalAgent
import sys

def test_agent():
    print("Iniciando Teste do Agente...")
    try:
        agent = ProfessionalAgent()
        
        # Teste 1: Pergunta simples de vendas
        print("\n--- Teste 1: Vendas Hoje ---")
        response = agent.send_message("Como estão as vendas de hoje?")
        print(f"Resposta: {response}")
        
        if "Vendas" in response or "R$" in response or "vendas" in response:
            print("[OK] Teste 1 Passou")
        else:
            print("[ALERTA] Teste 1 falhou ou nao retornou dados de vendas.")

        # Teste 2: Pergunta de Estoque (Banana - assumindo que existe ou não)
        print("\n--- Teste 2: Estoque de Banana ---")
        response = agent.send_message("Tem banana no estoque?")
        print(f"Resposta: {response}")
        
        print("\n[OK] Teste Concluido!")
        
    except Exception as e:
        print(f"[ERRO] Critico no Teste: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_agent()
