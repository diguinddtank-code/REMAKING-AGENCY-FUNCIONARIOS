import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => boolean;
  onRegister: (name: string, email: string, pass: string) => boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    let success = false;
    if (isLogin) {
      success = onLogin(formData.email, formData.password);
      if (!success) setError('Credenciais inválidas.');
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Preencha todos os campos.');
        setIsLoading(false);
        return;
      }
      success = onRegister(formData.name, formData.email, formData.password);
      if (!success) setError('E-mail indisponível.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-black border border-agency-800 rounded-2xl p-8 relative z-10"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <img 
            src="https://i.imgur.com/kL00omR.png" 
            alt="Remaking Agency" 
            className="h-16 mb-4 object-contain"
          />
          <p className="text-agency-sub text-xs uppercase tracking-widest">Agency OS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="relative group">
                  <User size={16} className="absolute left-4 top-4 text-agency-sub group-focus-within:text-white transition-colors" />
                  <input 
                    type="text"
                    placeholder="Nome"
                    className="w-full bg-agency-900 border border-agency-800 rounded py-3.5 pl-11 pr-4 outline-none focus:border-white transition-all text-sm text-white placeholder:text-agency-800"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <Mail size={16} className="absolute left-4 top-4 text-agency-sub group-focus-within:text-white transition-colors" />
            <input 
              type="email"
              placeholder="Email"
              className={`w-full bg-agency-900 border rounded py-3.5 pl-11 pr-4 outline-none focus:border-white transition-all text-sm text-white placeholder:text-agency-800 ${error ? 'border-red-900' : 'border-agency-800'}`}
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-4 text-agency-sub group-focus-within:text-white transition-colors" />
            <input 
              type="password"
              placeholder="Senha"
              className={`w-full bg-agency-900 border rounded py-3.5 pl-11 pr-4 outline-none focus:border-white transition-all text-sm text-white placeholder:text-agency-800 ${error ? 'border-red-900' : 'border-agency-800'}`}
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-4 rounded font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {isLoading ? "Processando..." : (isLogin ? 'Entrar' : 'Registrar')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-agency-sub hover:text-white text-xs underline decoration-agency-800 hover:decoration-white underline-offset-4"
          >
            {isLogin ? 'Criar conta nova' : 'Já possuo conta'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
