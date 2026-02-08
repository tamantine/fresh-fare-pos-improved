import os
import sys
from agent import ProfessionalAgent
import colorama
from colorama import Fore, Style, Back

# Adiciona o diretório atual ao path para imports funcionarem caso rode de fora
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def main():
    colorama.init(autoreset=True)
    clear_screen()

    print(f"{Back.GREEN}{Fore.WHITE} HORTIFRUTI BOM PREÇO - AGENTE INTELIGENTE {Style.RESET_ALL}")
    print(f"{Fore.CYAN}Iniciando sistema...{Style.RESET_ALL}")

    try:
        agent = ProfessionalAgent()
        print(f"{Fore.GREEN}[OK] Sistema Online!{Style.RESET_ALL}")
        print("--------------------------------------------------")
        print("Digite sua pergunta sobre o mercado (Vendas, Estoque, etc).")
        print("Digite 'sair' ou 'q' para encerrar.")
        print("--------------------------------------------------\n")

        while True:
            try:
                user_input = input(f"{Fore.BLUE}[Voce]: {Style.RESET_ALL}").strip()
                
                if not user_input:
                    continue
                    
                if user_input.lower() in ['sair', 'q', 'exit']:
                    print(f"\n{Fore.RED}[Saindo] Encerrando agente. Ate logo!{Style.RESET_ALL}")
                    break

                # Processamento
                response = agent.send_message(user_input)
                
                print(f"\n{Fore.MAGENTA}[Agente]:{Style.RESET_ALL}")
                print(f"{response}")
                print("-" * 50 + "\n")

            except KeyboardInterrupt:
                print(f"\n{Fore.RED}[Saindo] Encerrando...{Style.RESET_ALL}")
                break

    except Exception as e:
        print(f"\n{Back.RED}{Fore.WHITE} ERRO CRITICO {Style.RESET_ALL}")
        print(f"Falha ao iniciar o agente: {e}")
        print("Verifique se o arquivo .env esta configurado corretamente com GEMINI_API_KEY e SUPABASE_URL.")

if __name__ == "__main__":
    main()
