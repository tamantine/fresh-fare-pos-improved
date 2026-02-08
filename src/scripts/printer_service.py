
import os
import json
import ssl
import urllib.request
import urllib.parse
from datetime import datetime

# ==========================================
# CONFIGURATION
# ==========================================
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://juhiiwsxrzhxprgbpeia.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "") # Use Service Role for backend scripts

# Printer Config (Change as needed)
PRINTER_IP = "192.168.1.200" # Network Printer
PRINTER_PORT = 9100

# ==========================================
# 1. SUPABASE CLIENT (Standard Lib)
# ==========================================
class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        # SSL Context to avoid certification errors on some legacy OS
        self.ctx = ssl.create_default_context()
        self.ctx.check_hostname = False
        self.ctx.verify_mode = ssl.CERT_NONE

    def _request(self, method: str, endpoint: str, data: dict = None):
        try:
            full_url = f"{self.url}/rest/v1{endpoint}"
            body = json.dumps(data).encode('utf-8') if data else None
            
            req = urllib.request.Request(full_url, data=body, headers=self.headers, method=method)
            
            with urllib.request.urlopen(req, context=self.ctx) as response:
                if 200 <= response.status < 300:
                    resp_body = response.read()
                    return json.loads(resp_body) if resp_body else None
                else:
                    print(f"Error {response.status}: {response.read().decode()}")
                    return None
        except Exception as e:
            print(f"Connection Error: {e}")
            return None

    def get_vendas_abertas(self):
        # Fetch sales that haven't printed cupom yet
        # Uses 'eq' filter notation for PostgREST
        query = "/vendas?select=*,itens_venda(*,produtos(nome))&cupom_impresso=is.false&status=eq.finalizada&limit=5"
        return self._request("GET", query)

    def mark_printed(self, venda_id):
        return self._request("PATCH", f"/vendas?id=eq.{venda_id}", {"cupom_impresso": True})

# ==========================================
# 2. ESC/POS PRINTER LOGIC
# ==========================================
class EscPosPrinter:
    # Commands
    ESC = b'\x1b'
    GS = b'\x1d'
    INIT = ESC + b'@'
    CUT = GS + b'V\x42\x00' # Full Cut
    
    # Align
    ALIGN_LEFT = ESC + b'a\x00'
    ALIGN_CENTER = ESC + b'a\x01'
    ALIGN_RIGHT = ESC + b'a\x02'

    # Font
    BOLD_ON = ESC + b'E\x01'
    BOLD_OFF = ESC + b'E\x00'
    SIZE_NORMAL = GS + b'!\x00'
    SIZE_LARGE = GS + b'!\x11'

    def __init__(self, ip=None, port=9100):
        self.ip = ip
        self.port = port
        self.buffer = b''

    def text(self, txt: str):
        # Convert to CP850 (Western) or fallback to ascii
        try:
            self.buffer += txt.encode('cp850', errors='replace')
        except:
            self.buffer += txt.encode('utf-8', errors='ignore')

    def text_ln(self, txt: str = ""):
        self.text(txt + '\n')

    def separator(self):
        self.text_ln("-" * 48) # 48 chars is standard for 80mm

    def format_money(self, val):
        return f"R$ {float(val):.2f}".replace('.', ',')

    def generate_receipt(self, venda):
        self.buffer = b''
        self.buffer += self.INIT
        
        # HEADER
        self.buffer += self.ALIGN_CENTER + self.BOLD_ON + self.SIZE_LARGE
        self.text_ln("HORTIFRUTI BOM PRECO")
        self.buffer += self.SIZE_NORMAL + self.BOLD_OFF
        self.text_ln("Salto de Pirapora, SP")
        self.text_ln(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        self.text_ln(f"Venda: #{venda.get('numero_venda', '???')}")
        self.separator()

        # BODY
        self.buffer += self.ALIGN_LEFT
        self.text_ln(f"{'ITEM':<20} {'QTD':<5} {'UN':<8} {'TOTAL':>10}")
        self.separator()

        itens = venda.get('itens_venda', [])
        for item in itens:
            nome = item.get('produtos', {}).get('nome', 'Item')[:20]
            qtd = float(item.get('quantidade', 0))
            preco = float(item.get('preco_unitario', 0))
            subtotal = float(item.get('subtotal', 0))
            
            # Line 1: Name
            self.text_ln(f"{nome}")
            # Line 2: Values
            line = f"   {qtd:.3f} x {self.format_money(preco):<8} = {self.format_money(subtotal)}"
            self.buffer += self.ALIGN_RIGHT
            self.text_ln(line)

        # FOOTER
        self.separator()
        self.buffer += self.BOLD_ON + self.SIZE_LARGE
        
        total = float(venda.get('total', 0))
        forma = venda.get('forma_pagamento', 'Dinheiro')
        
        self.text_ln(f"TOTAL: {self.format_money(total)}")
        self.buffer += self.SIZE_NORMAL + self.BOLD_OFF
        self.text_ln(f"Pagamento: {forma.upper()}")
        
        self.padding(2)
        self.buffer += self.ALIGN_CENTER
        self.text_ln("Nao e documento fiscal")
        self.text_ln("Agradecemos a preferencia!")
        self.padding(4)
        
        # CUT
        self.buffer += self.CUT

        return self.buffer

    def padding(self, lines):
        self.text('\n' * lines)

    def print_network(self, data):
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(5)
                sock.connect((self.ip, self.port))
                sock.sendall(data)
                return True
        except Exception as e:
            print(f"Print Error: {e}")
            return False

# ==========================================
# 3. MAIN LOOP
# ==========================================
def main():
    print(">>> Servico de Impressao Iniciado")
    
    # Check credentials
    if not SUPABASE_KEY:
        print("ERRO: SUPABASE_SERVICE_ROLE_KEY nao encontrada.")
        return

    client = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    printer = EscPosPrinter(ip=PRINTER_IP) # Set IP here or via env var

    # Simulated Loop (In production, use time.sleep)
    # 1. Fetch sales
    print("Buscando vendas para impressao...")
    vendas = client.get_vendas_abertas()
    
    if not vendas:
        print("Nenhuma venda pendente.")
        return

    for venda in vendas:
        print(f"Processando venda #{venda.get('numero_venda')}...")
        
        # 2. Generate Binary
        cupom_data = printer.generate_receipt(venda)
        
        # 3. Print (Simulated check if IP is set)
        if printer.ip and printer.ip != "0.0.0.0":
            success = printer.print_network(cupom_data)
        else:
            # Save to file for testing/USB spooler pick-up
            filename = f"cupom_{venda['id']}.bin"
            with open(filename, "wb") as f:
                f.write(cupom_data)
            print(f"Cupom salvo em arquivo: {filename}")
            success = True # Assume success for local file

        # 4. Update Database
        if success:
            res = client.mark_printed(venda['id'])
            if res:
                print(" >> Venda marcada como impressa.")
            else:
                print(" >> Erro ao atualizar status no banco.")

if __name__ == "__main__":
    main()
