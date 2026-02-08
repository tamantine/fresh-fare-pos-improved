import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env (se existir)
load_dotenv()

class SupabaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseManager, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            print("[ERRO] Credenciais do Supabase nao encontradas.")
            print("Certifique-se de definir SUPABASE_URL e SUPABASE_KEY no arquivo .env")
            self.client = None
        else:
            try:
                self.client: Client = create_client(url, key)
                print("[OK] Conexao com Supabase inicializada.")
            except Exception as e:
                print(f"[ERRO] ao conectar Supabase: {e}")
                self.client = None

    def get_client(self) -> Client:
        return self.client

# Singleton Usage
def get_supabase() -> Client:
    return SupabaseManager().get_client()
