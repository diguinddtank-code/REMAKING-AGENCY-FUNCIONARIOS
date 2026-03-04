import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  onLogin: () => void;
  onOffline: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin, onOffline }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase!.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Verifique seu email para confirmar o cadastro!');
      }
      onLogin();
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message.includes("disabled") || err.message.includes("provider is not enabled")) {
        setError("O login por Email/Senha não está habilitado. Vá no painel do Supabase > Authentication > Providers e habilite 'Email'.");
      } else if (err.message.includes("Invalid login credentials")) {
        setError("Email ou senha incorretos.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agency-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-agency-900 border border-agency-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <img 
            src="https://i.imgur.com/kL00omR.png" 
            alt="Logo" 
            className="h-12 mx-auto mb-4 object-contain"
          />
          <h2 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
          </h2>
          <p className="text-agency-sub text-sm">
            {isLogin ? 'Entre para acessar seus dados sincronizados' : 'Comece a organizar sua vida e agência'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-agency-sub uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-agency-sub" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-agency-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-agency-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-agency-sub uppercase tracking-widest mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-agency-sub" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-agency-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-agency-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Cadastrar'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-agency-sub hover:text-white text-sm transition-colors block w-full"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-agency-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-agency-900 px-2 text-agency-sub">Ou</span>
            </div>
          </div>

          <button
            onClick={onOffline}
            className="text-agency-sub hover:text-white text-xs transition-colors flex items-center justify-center gap-2 w-full py-2 hover:bg-white/5 rounded-lg"
          >
            Continuar sem conta (Offline)
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthView;
