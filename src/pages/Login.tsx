import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  // Verificar se já está logado
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Registro
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Verifique seu email para confirmar o registro.',
        });
        setIsSignUp(false);
        setEmail('');
        setPassword('');
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Login realizado!',
          description: 'Bem-vindo ao Hortifruti Bom Preço.',
        });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
      toast({
        title: 'Erro',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#27ae60] to-[#1a3a2a] flex items-center justify-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Logo e Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-lg overflow-hidden border-4 border-white">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Hortifruti Bom Preço</h1>
          <p className="text-white/80 text-sm">Sistema PDV Profissional</p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {/* Título do Formulário */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isSignUp ? 'Criar Conta' : 'Acessar Sistema'}
          </h2>

          {/* Mensagem de Erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-[#27ae60] rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 h-12 border-2 border-gray-200 focus:border-[#27ae60] rounded-lg"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botão de Envio */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#27ae60] hover:bg-[#219150] text-white font-bold rounded-lg mt-6 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>

          {/* Divisor */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Alternar entre Login e Signup */}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setEmail('');
              setPassword('');
            }}
            className="w-full py-3 text-center text-sm font-semibold text-[#27ae60] hover:text-[#219150] transition-colors"
          >
            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Crie uma'}
          </button>
        </div>

        {/* Informações de Rodapé */}
        <div className="text-center text-white/70 text-xs">
          <p>Desenvolvido com 💚 para o seu negócio</p>
          <p className="mt-2">© 2026 Hortifruti Bom Preço. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
