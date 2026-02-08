from http.server import BaseHTTPRequestHandler
import json
import os
import requests

# --- CONFIG ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

# --- SUPABASE HTTP CLIENT (Lightweight) ---
def supabase_rpc(function_name, params=None):
    """Call a Supabase RPC function"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.post(url, headers=headers, json=params or {})
    return resp.json() if resp.status_code == 200 else None

def supabase_select(table, select="*", filters=None, limit=None):
    """Select from Supabase via REST"""
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
    if filters:
        for k, v in filters.items():
            url += f"&{k}={v}"
    if limit:
        url += f"&limit={limit}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise Exception(f"Supabase Error: {resp.text}")
    return resp.json()

# --- HANDLER ---

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"message": "API is running (Agent removed)"}).encode('utf-8'))

    def do_GET(self):
        self.send_response(200)
        self.wfile.write("Python API OK".encode('utf-8'))

