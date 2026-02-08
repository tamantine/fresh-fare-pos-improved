# Configuração do Módulo de Hardware PDV

Este módulo Python (`pos_hardware.py`) gerencia a impressora térmica USB e a integração de vendas com o Supabase.

## Requisitos

1. Python 3.8+ instalado.
2. Variáveis de ambiente configuradas no arquivo `.env` na raiz do projeto (mesmo nível que `package.json`).
   - `VITE_SUPABASE_URL` ou `SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` ou `SUPABASE_KEY`

## Instalação das Dependências

Abra o terminal na pasta `src/python` e execute:

```bash
pip install -r requirements.txt
```

No Windows, pode ser necessário instalar o driver `libusb`. Uma ferramenta recomendada para associar o driver USB genérico à impressora é o **Zadig** (instale o driver `WinUSB` para a impressora).

## Uso

O script pode ser executado manualmente para testes ou invocado por outras aplicações.

### Comandos Disponíveis

1. **Detectar Impressora** (Verifica se há impressora conectada):
   ```bash
   python pos_hardware.py detect
   ```
   *Retorna código de saída 0 se encontrar, 1 se falhar.*

2. **Simular Detecção** (Para testes sem hardware):
   ```bash
   python pos_hardware.py detect --simulate
   ```

3. **Rodar Venda de Teste** (Fluxo completo: Detecção -> Supabase -> Estoque -> Impressão):
   ```bash
   python pos_hardware.py --test-sale --simulate
   ```
   *O modo `--simulate` imprime a saída no console em vez da impressora física.*

## Solução de Problemas

- **Erro "USBNotFoundError"**: Verifique se o cabo está conectado e se o driver WinUSB foi instalado via Zadig.
- **Erro de Supabase**: Verifique as credenciais no `.env`.
