import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Download, Smartphone, Monitor, ChevronRight, ShieldCheck, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onInstallApp?: () => void;
  canInstall?: boolean;
  onLogout: () => void;
  userEmail?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ theme, toggleTheme, onInstallApp, canInstall, onLogout, userEmail }) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotification = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tighter mb-1">Configurações</h2>
        <p className="text-agency-sub text-sm">Personalize sua experiência no REMAKING.</p>
      </div>

      {/* App Installation / Update Section */}
      <div className="bg-gradient-to-br from-primary-900/40 to-agency-900 border border-primary-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary-500/20 text-primary-500 rounded-xl">
               <Smartphone size={24} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white">Aplicativo Remaking</h3>
               <p className="text-sm text-agency-sub">
                 {canInstall 
                   ? "Instale o app para melhor performance e acesso offline." 
                   : "O aplicativo já está instalado ou rodando no navegador."}
               </p>
             </div>
          </div>
          
          {canInstall ? (
            <button 
              onClick={onInstallApp}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-glow hover:bg-primary-500 transition-all flex items-center gap-2 uppercase text-xs tracking-wider"
            >
              <Download size={16} /> Instalar
            </button>
          ) : (
            <div className="flex items-center gap-2 text-success-500 text-xs font-bold uppercase tracking-widest bg-success-500/10 px-4 py-2 rounded-lg border border-success-500/20">
              <ShieldCheck size={14} /> Ativo
            </div>
          )}
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="grid gap-4">
        
        {/* Theme Toggle */}
        <motion.div 
          className="bg-agency-900 border border-agency-800 p-5 rounded-xl flex items-center justify-between hover:border-agency-sub/30 transition-colors"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-agency-black rounded-lg text-agency-text border border-agency-800">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <p className="font-bold text-white text-sm">Aparência</p>
              <p className="text-xs text-agency-sub">Alternar entre modo claro e escuro</p>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-agency-800 border border-agency-sub/20 transition-colors"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform duration-200 ${
                theme === 'light' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </motion.div>

        {/* Notification Toggle */}
        <motion.div 
          className="bg-agency-900 border border-agency-800 p-5 rounded-xl flex items-center justify-between hover:border-agency-sub/30 transition-colors"
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-agency-black rounded-lg text-agency-text border border-agency-800">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Notificações</p>
              <p className="text-xs text-agency-sub">Alertas de tarefas e leads</p>
            </div>
          </div>
          
          <button 
            onClick={requestNotification}
            disabled={notificationPermission === 'granted'}
            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-all ${
              notificationPermission === 'granted' 
                ? 'text-success-500 bg-success-500/10 border border-success-500/20' 
                : 'bg-primary-600 text-white hover:bg-primary-500 shadow-glow'
            }`}
          >
            {notificationPermission === 'granted' ? 'Ativado' : 'Ativar'}
          </button>
        </motion.div>
      </div>

      {/* Account Info */}
      <div className="pt-8 border-t border-agency-800">
        <h3 className="text-sm font-bold text-agency-sub uppercase tracking-widest mb-4">Conta</h3>
        <div className="bg-black border border-agency-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white font-bold text-lg border border-agency-800">
               {userEmail ? userEmail.substring(0,2).toUpperCase() : 'US'}
            </div>
            <div>
               <p className="text-white font-bold">{userEmail || 'Usuário'}</p>
               <p className="text-agency-sub text-xs">Plano Premium • Vitalício</p>
            </div>
          </div>

          <button 
             onClick={onLogout}
             className="flex items-center justify-center gap-2 px-6 py-2 border border-red-900/50 bg-red-900/10 text-red-500 hover:bg-red-900/20 rounded font-bold text-xs uppercase tracking-wide transition-colors"
          >
            <LogOut size={16} /> Sair da Conta
          </button>
        </div>
        <div className="mt-4 text-center">
            <p className="text-[10px] text-agency-800">REMAKING OS v2.1.0 (Build 4092)</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;