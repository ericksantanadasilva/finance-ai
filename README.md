💰 Finance.ai — Gestão Financeira com IA
O Finance.ai é um assistente financeiro completo desenvolvido com o que há de mais moderno no ecossistema Web. O diferencial está na integração com Inteligência Artificial para automação de registros e análise de dados, transformando a forma como você cuida do seu dinheiro.

🚀 Diferenciais do Projeto
🤖 Assistente de Importação com IA: Basta copiar o texto do seu extrato bancário e a IA categoriza e registra tudo automaticamente.

📊 Dashboards Dinâmicos: Gráficos de fluxo de caixa e gastos por categoria para visualização clara da saúde financeira.

🎯 Gestão de Metas: Planeje seus sonhos com barras de progresso dinâmicas e depósitos rápidos.

🌓 Dark & Light Mode: Interface elegante que se adapta à preferência do usuário ou do sistema.

👤 Perfil em Tempo Real: Atualização instantânea de dados do usuário (nome, iniciais estilizadas) em toda a aplicação via React Context.

🛠 Tech Stack
O projeto utiliza as tecnologias mais solicitadas pelo mercado de trabalho em 2026:

Framework: Next.js 15 (App Router)

Linguagem: TypeScript

Estilização: Tailwind CSS v4

Banco de Dados: PostgreSQL via Supabase

ORM: Prisma

Autenticação: Supabase Auth

Componentes: Lucide React (Ícones) e Sonner (Toasts)

📦 Como Instalar e Rodar
1. Clonar o repositório
Bash
git clone https://github.com/seu-usuario/finance-ai.git
cd finance-ai

3. Instalar dependências
Bash
npm install

4. Configurar Variáveis de Ambiente
Crie um arquivo .env na raiz e preencha com suas credenciais do Supabase e OpenAI/Google AI:

Snippet de código
DATABASE_URL="sua_url_do_prisma"
DIRECT_URL="sua_url_direta_supabase"
NEXT_PUBLIC_SUPABASE_URL="sua_url_api_supabase"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_anon_supabase"
GOOGLE_AI_API_KEY="sua_chave_da_ia"

4. Sincronizar Banco de Dados
Bash
npx prisma db push

6. Rodar o projeto
Bash
npm run dev
🎨 Design System
O projeto foi construído sobre um sistema de variáveis CSS customizadas, permitindo a troca de temas sem "flicker" e garantindo acessibilidade em qualquer tela.

📄 Licença
Este projeto está sob a licença MIT. Sinta-se à vontade para usar, modificar e comercializar.

⭐ Gostou do projeto? Considere dar uma estrela no repositório!
