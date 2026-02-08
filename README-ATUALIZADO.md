# 🍎 Fresh Fare POS - Sistema Profissional de PDV

## 📋 Sobre o Projeto

Sistema completo de Ponto de Venda (PDV) e gestão de estoque desenvolvido especialmente para hortifrutis e mercados. Interface moderna, rápida e intuitiva com suporte offline e sincronização automática com banco de dados Supabase.

---

## ✨ Principais Funcionalidades

### 🛒 PDV Completo
- Vendas rápidas por código de barras ou busca
- Suporte a produtos por peso e unidade
- Múltiplas formas de pagamento (Dinheiro, Débito, Crédito, PIX)
- Atalhos de teclado para agilidade
- Impressão de cupom fiscal

### 📦 Gestão de Estoque
- Controle completo de inventário
- Alertas de estoque baixo
- Histórico de movimentações
- Gestão de validade para perecíveis
- Ajustes de estoque com motivo

### 📊 Dashboard e Relatórios
- Estatísticas em tempo real
- Total de vendas e faturamento
- Ticket médio
- Produtos com estoque baixo
- Gráficos e métricas

### 🔌 Conexão Supabase
- Monitoramento de conexão em tempo real
- Indicador visual de status
- Sincronização automática
- Sistema offline com cache

---

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **Estado:** Zustand + React Query
- **Banco de Dados:** Supabase (PostgreSQL)
- **Offline:** IndexedDB
- **Ícones:** Lucide React

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git (opcional)

### Passo a Passo

1. **Descompacte o projeto** (se estiver em ZIP)
   ```bash
   unzip fresh-fare-pos-improved.zip
   cd fresh-fare-pos-improved
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   O arquivo `.env` já está configurado com as credenciais do Supabase:
   ```env
   VITE_SUPABASE_PROJECT_ID="yalfrgzcaipaxvtznkpq"
   VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-aqui"
   VITE_SUPABASE_URL="https://yalfrgzcaipaxvtznkpq.supabase.co"
   ```

4. **Execute as migrations do banco de dados**
   
   As migrations estão em `supabase/migrations/`. Para aplicá-las:
   - Acesse o painel do Supabase
   - Vá em SQL Editor
   - Execute o conteúdo do arquivo de migration

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse no navegador**
   ```
   http://localhost:5173
   ```

---

## 🏗️ Estrutura do Projeto

```
fresh-fare-pos-improved/
├── src/
│   ├── components/           # Componentes React
│   │   ├── pdv/             # Componentes do PDV
│   │   ├── estoque/         # Componentes de estoque
│   │   ├── ui/              # Componentes de UI (shadcn)
│   │   ├── ConnectionStatusIndicator.tsx
│   │   ├── DashboardStats.tsx
│   │   └── ErrorBoundary.tsx
│   ├── hooks/               # Hooks personalizados
│   │   ├── useSupabaseConnection.ts
│   │   ├── useSupabaseData.ts
│   │   ├── useProdutos.ts
│   │   └── useVendas.ts
│   ├── integrations/        # Integrações externas
│   │   └── supabase/
│   │       ├── client.ts    # Cliente Supabase
│   │       ├── service.ts   # Serviços otimizados
│   │       └── types.ts     # Tipos do banco
│   ├── offline/             # Sistema offline
│   │   ├── db.ts           # IndexedDB
│   │   ├── sync.ts         # Sincronização
│   │   └── cache.ts        # Cache
│   ├── pages/              # Páginas da aplicação
│   │   ├── Index.tsx       # Página inicial
│   │   ├── PDV.tsx         # Página do PDV
│   │   └── Estoque.tsx     # Página de estoque
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   └── App.tsx             # Componente raiz
├── supabase/
│   └── migrations/         # Migrations do banco
├── public/                 # Arquivos estáticos
├── .env                    # Variáveis de ambiente
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── LEIA-ME-PRIMEIRO.md
├── MELHORIAS.md
├── MELHORIAS-SUPABASE.md   # ← Nova documentação
└── README-ATUALIZADO.md    # ← Este arquivo
```

---

## 🎯 Novidades da Versão 2.0

### 🔌 Sistema de Conexão Aprimorado

1. **Serviço de Abstração Supabase** (`service.ts`)
   - Camada completa de serviços
   - Métodos otimizados para todas as operações
   - Tipagem completa
   - Tratamento de erros consistente

2. **Monitoramento de Conexão** (`useSupabaseConnection.ts`)
   - Verificação automática periódica
   - Detecção de reconexão
   - Status em tempo real

3. **Indicador Visual** (`ConnectionStatusIndicator.tsx`)
   - Badge colorido no canto superior direito
   - Tooltip com informações detalhadas
   - Botão de atualização manual

4. **Hooks Otimizados** (`useSupabaseData.ts`)
   - Cache inteligente
   - Invalidação automática
   - Melhor performance

5. **Dashboard de Estatísticas** (`DashboardStats.tsx`)
   - Total de vendas
   - Valor total
   - Ticket médio
   - Produtos com estoque baixo

6. **Error Boundary** (`ErrorBoundary.tsx`)
   - Captura erros globais
   - Interface amigável
   - Opções de recuperação

---

## 📖 Como Usar

### Iniciando uma Venda

1. Acesse a página **PDV** pelo menu
2. Busque produtos por nome ou código de barras
3. Clique nos produtos para adicionar ao carrinho
4. Ajuste quantidades se necessário
5. Clique em **Finalizar Venda**
6. Selecione a forma de pagamento
7. Confirme a venda

### Gerenciando Estoque

1. Acesse a página **Estoque** pelo menu
2. Visualize todos os produtos cadastrados
3. Use os filtros para buscar produtos específicos
4. Clique em **Adicionar Produto** para cadastrar novos
5. Use **Ajustar Estoque** para entrada/saída
6. Visualize o histórico de movimentações

### Monitorando o Sistema

1. Na página inicial, veja o **Dashboard de Estatísticas**
2. Verifique o **Indicador de Conexão** no canto superior direito
3. Clique no botão de atualização para verificar a conexão manualmente
4. Passe o mouse sobre o indicador para ver detalhes

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Gera build de produção
npm run build:dev        # Gera build de desenvolvimento

# Qualidade de Código
npm run lint             # Verifica erros de linting

# Testes
npm run test             # Executa testes
npm run test:watch       # Executa testes em modo watch

# Preview
npm run preview          # Preview do build de produção
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `produtos`
- Informações dos produtos
- Preços (kg e unidade)
- Estoque atual e mínimo
- Categoria e fornecedor

#### `categorias`
- Categorias de produtos
- Hierarquia (categoria pai)
- Cores e ícones

#### `vendas`
- Cabeçalho das vendas
- Valores e descontos
- Forma de pagamento
- Status

#### `itens_venda`
- Itens de cada venda
- Quantidade e preços
- Descontos por item

#### `movimentacoes_estoque`
- Histórico de movimentações
- Entrada, saída, ajuste, venda
- Estoque anterior e novo
- Motivo

#### `fornecedores`
- Dados dos fornecedores
- Contatos e endereços

---

## 🎨 Personalização

### Cores e Tema

As cores podem ser personalizadas no arquivo `src/index.css`:

```css
:root {
  --primary: 142 76% 36%;        /* Verde principal */
  --primary-hover: 142 76% 30%;  /* Verde hover */
  --accent: 45 93% 47%;          /* Amarelo */
  --success: 142 71% 45%;        /* Verde sucesso */
  --warning: 38 92% 50%;         /* Laranja */
  /* ... */
}
```

### Logo e Branding

- Logo: Edite o emoji no arquivo `src/pages/Index.tsx` (linha 21)
- Nome: Altere "Hortifruti Bom Preço" nos arquivos de páginas
- Favicon: Substitua `public/favicon.ico`

---

## 🐛 Solução de Problemas

### Erro de Conexão com Supabase

1. Verifique se as variáveis de ambiente estão corretas no `.env`
2. Confirme que as migrations foram executadas
3. Verifique o indicador de conexão no canto superior direito
4. Clique no botão de atualização para testar a conexão

### Produtos não aparecem

1. Verifique se há produtos cadastrados no banco
2. Confirme que os produtos estão com `ativo = true`
3. Limpe o cache do navegador
4. Verifique o console para erros

### Erro ao finalizar venda

1. Verifique se há estoque suficiente
2. Confirme a conexão com o banco
3. Verifique os logs no console
4. Tente novamente após alguns segundos

---

## 📚 Documentação Adicional

- **LEIA-ME-PRIMEIRO.md** - Resumo das melhorias visuais
- **MELHORIAS.md** - Documentação das melhorias de UI/UX
- **MELHORIAS-SUPABASE.md** - Documentação completa das melhorias de conexão
- **Supabase Docs** - https://supabase.com/docs

---

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é de uso livre para fins educacionais e comerciais.

---

## 👥 Suporte

Para dúvidas ou problemas:
- Consulte a documentação em `MELHORIAS-SUPABASE.md`
- Verifique os logs no console do navegador
- Teste a conexão com o indicador de status

---

## 🎉 Agradecimentos

Desenvolvido com 💚 para revolucionar a gestão de hortifrutis e mercados.

**Versão:** 2.0  
**Última Atualização:** Fevereiro 2026  
**Status:** ✅ Produção

---

## 🚀 Próximas Funcionalidades

- [ ] Autenticação de usuários
- [ ] Relatórios avançados com gráficos
- [ ] Integração com impressora fiscal
- [ ] App mobile (React Native)
- [ ] Sistema de fidelidade
- [ ] Notificações push
- [ ] Backup automático
- [ ] Multi-loja

---

**Boas vendas! 🍎🥕🍌**
