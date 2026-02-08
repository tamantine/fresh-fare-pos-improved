import os
import google.generativeai as genai
from dotenv import load_dotenv
from tools import TOOL_MAP, get_vendas_resumo, check_stock
import colorama
from colorama import Fore, Style

load_dotenv()
colorama.init(autoreset=True)

class ProfessionalAgent:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY não encontrada no .env")

        genai.configure(api_key=api_key)
        
        # Configuração do Modelo com Tools (Function Calling)
        # O SDK do Python permite passar as funções direto para 'tools'
        self.tools_list = [get_vendas_resumo, check_stock]
        
        self.model = genai.GenerativeModel(
            model_name='gemini-flash-latest',
            tools=self.tools_list,
            system_instruction="""
            Voce e o Gerente Inteligente do "Hortifruti Bom Preco".
            Sua funcao e auxiliar o dono do mercado com informacoes precisas e insights.
            
            REGRAS:
            1. Sempre responda em Portugues do Brasil (PT-BR).
            2. Seja profissional e direto. NAO use emojis (causa erro no terminal).
            3. USE AS FERRAMENTAS disponiveis para responder perguntas sobre Vendas e Estoque. NUNCA invente dados.
            4. Se a ferramenta retornar um erro, avise o usuario honestamente.
            5. Se o usuario perguntar algo fora do contexto do mercado, responda educadamente que seu foco e a gestao do hortifruti.
            
            Contexto: Voce tem acesso direto ao banco de dados via ferramentas. Acredite nos dados retornados pelas ferramentas.
            """
        )
        
        # Inicia chat com histórico automático
        self.chat = self.model.start_chat(enable_automatic_function_calling=True)

    def send_message(self, message: str) -> str:
        """
        Envia mensagem para o agente e retorna a resposta.
        O SDK lida automaticamente com a chamada de ferramenta e o loop de resposta (round-trip).
        """
        try:
            print(f"{Fore.CYAN}[Agente] Pensando...{Style.RESET_ALL}")
            response = self.chat.send_message(message)
            return response.text
        except Exception as e:
            return f"[Erro] no Agente: {str(e)}"

# Teste simples se rodar direto
if __name__ == "__main__":
    agent = ProfessionalAgent()
    print("Agente Iniciado. Digite 'sair' para encerrar.")
    while True:
        msg = input(f"{Fore.GREEN}Voce: {Style.RESET_ALL}")
        if msg.lower() in ['sair', 'exit']: break
        resp = agent.send_message(msg)
        print(f"{Fore.YELLOW}Agente:{Style.RESET_ALL} {resp}\n")
