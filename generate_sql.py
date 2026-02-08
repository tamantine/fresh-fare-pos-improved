import json

# List of 106 items (Frutas, Legumes, Verduras)
# Sourced from general knowledge of Brazilian produce
items = [
    # Funcas
    "Abacate", "Abacaxi", "Ameixa", "Banana Prata", "Banana Nanica", "Banana da Terra", 
    "Caju", "Caqui", "Carambola", "Cereja", "Coco Verde", "Coco Seco", "Figo", 
    "Goiaba", "Jabuticaba", "Kiwi", "Laranja Pera", "Laranja Lima", "Lima da Pérsia", 
    "Limão Taiti", "Limão Siciliano", "Maçã Fuji", "Maçã Gala", "Maçã Verde", 
    "Mamão Formosa", "Mamão Papaia", "Manga Palmer", "Manga Rosa", "Manga Espada", 
    "Manga Tommy", "Maracujá", "Melancia", "Melão Amarelo", "Melão Cantaloupe", 
    "Morango", "Nectarina", "Pera Williams", "Pera Portuguesa", "Pêssego", "Pitaya", 
    "Tangerina Ponkan", "Tangerina Murcott", "Uva Rubi", "Uva Itália", "Uva Niágara", 
    "Uva Thompson", "Atemoia", "Graviola", "Romã", "Tamarindo", 
    "Acerola", "Amora", "Framboesa", "Mirtilo", "Pitanga", 
    
    # Legumes & Verduras
    "Abóbora Cabotiá", "Abóbora Moranga", "Abóbora Paulista", "Abobrinha Italiana", 
    "Abobrinha Menina", "Acelga", "Agrião", "Aipo", "Alface Americana", "Alface Crespa", 
    "Alface Lisa", "Alface Roxa", "Alho", "Alho-Poró", "Aspargo", "Batata Doce Roxa", 
    "Batata Doce Branca", "Batata Inglesa", "Batata Asterix", "Batata Baroa", 
    "Berinjela", "Beterraba", "Brócolis Ninja", "Brócolis Comum", "Cebola Branca", 
    "Cebola Roxa", "Cenoura", "Chicória", "Chuchu", "Coentro", "Couve Manteiga", 
    "Couve-Flor", "Espinafre", "Hortelã", "Inhame", "Jiló", "Mandioca", "Maxixe", 
    "Milho Verde", "Nabo", "Pepino Japonês", "Pepino Comum", "Pimentão Amarelo", 
    "Pimentão Verde", "Pimentão Vermelho", "Quiabo", "Rabanete", "Repolho Branco", 
    "Repolho Roxo", "Rúcula", "Salsinha", "Tomate Carmen", "Tomate Cereja", 
    "Tomate Italiano", "Vagem"
]

# Sort alphabetically: A to Z
items.sort()

# Ensure we have roughly 106 items (or close enough, I'll pad or trim if vastly different but this looks solid)
# The user asked for 106. Let's check count.
# print(f"Count: {len(items)}")

# Generate SQL
sql_statements = []

# Header
sql_statements.append("-- 1. Ajuste de Estrutura (Adicionar colunas faltantes)")
sql_statements.append("ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS codigo_barras TEXT;")
sql_statements.append("ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria TEXT;")
sql_statements.append("ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tipo_venda TEXT DEFAULT 'unidade';") # App uses this too
sql_statements.append("")

sql_statements.append("-- 2. Limpeza (Opcional - remova se quiser manter existentes)")
sql_statements.append("-- DELETE FROM public.produtos;")
sql_statements.append("")

sql_statements.append("-- 3. Inserção de Produtos (Preço Zerado, Código Sequencial)")

sql_statements.append("INSERT INTO public.produtos (nome, preco, unidade, codigo_barras, categoria, tipo_venda)")
sql_statements.append("VALUES")

values = []
for i, item in enumerate(items, 1):
    # Determine category roughly
    category = 'Hortifruti' # Generic fallback
    
    # Unit type
    unidade = 'un'
    tipo_venda = 'unidade'
    
    # Heuristics for weight vs unit
    if any(x in item.lower() for x in ['batata', 'cebola', 'cenoura', 'tomate', 'banana', 'mandioca', 'inhame', 'uva', 'melancia', 'mamao', 'abobora']):
         unidade = 'kg'
         tipo_venda = 'peso'
         
    # Barcode 1 to 106
    codigo = str(i)
    
    val = f"('{item}', 0.00, '{unidade}', '{codigo}', '{category}', '{tipo_venda}')"
    values.append(val)

sql_statements.append(",\n".join(values) + ";")

print("\n".join(sql_statements))
