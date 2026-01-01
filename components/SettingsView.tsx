import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Download, Smartphone, ShieldCheck, LogOut, ChevronRight, Laptop } from 'lucide-react';
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
    <div className="max-w-xl mx-auto pb-32 space-y-6 pt-2">
      
      {/* App Install Banner (Mobile Priority) */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 relative overflow-hidden shadow-glow">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-white/20 rounded-lg text-white backdrop-blur-sm">
               {canInstall ? <Smartphone size={24} /> : <ShieldCheck size={24} />}
             </div>
             <h3 className="text-lg font-bold text-white leading-tight">
               {canInstall ? "Instalar App" : "App Ativo"}
             </h3>
          </div>
          
          <p className="text-white/80 text-sm mb-5 leading-relaxed">
             {canInstall 
               ? "Instale o REMAKING na tela inicial para acesso offline e melhor performance." 
               : "Você está usando a versão mais recente do aplicativo."}
          </p>

          {canInstall && (
            <button 
              onClick={onInstallApp}
              className="w-full py-3.5 bg-white text-primary-700 font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
            >
              <Download size={18} /> Instalar Agora
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-agency-sub uppercase tracking-widest ml-1">Preferências</h3>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full bg-agency-900 border border-agency-800 p-4 rounded-xl flex items-center justify-between active:bg-agency-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-black rounded-lg text-white border border-agency-800">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-base">Tema</p>
              <p className="text-xs text-agency-sub">{theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}</p>
            </div>
          </div>
          <div className="relative h-6 w-11 rounded-full bg-agency-800 border border-agency-sub/20 pointer-events-none">
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${theme === 'light' ? 'translate-x-5' : ''}`} />
          </div>
        </button>

        {/* Notification Toggle */}
        <button 
          onClick={requestNotification}
          disabled={notificationPermission === 'granted'}
          className="w-full bg-agency-900 border border-agency-800 p-4 rounded-xl flex items-center justify-between active:bg-agency-800 transition-colors disabled:opacity-80"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-black rounded-lg text-white border border-agency-800">
              <Bell size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-base">Notificações</p>
              <p className="text-xs text-agency-sub">Alertas de CRM e Agenda</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${notificationPermission === 'granted' ? 'text-success-500' : 'text-primary-500'}`}>
               {notificationPermission === 'granted' ? 'On' : 'Off'}
            </span>
            <ChevronRight size={16} className="text-agency-sub" />
          </div>
        </button>
      </div>

      {/* Account Section */}
      <div className="pt-4 border-t border-agency-800/50 space-y-4">
        <h3 className="text-xs font-bold text-agency-sub uppercase tracking-widest ml-1">Conta</h3>
        
        <div className="bg-black border border-agency-800 rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-agency-800 rounded-full flex items-center justify-center text-white font-bold text-lg border border-agency-700">
               {userEmail ? userEmail.substring(0,2).toUpperCase() : 'US'}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-white font-bold truncate">{userEmail || 'Usuário'}</p>
               <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></div>
                 <p className="text-agency-sub text-xs">Sincronizado</p>
               </div>
            </div>
        </div>

        <button 
           onClick={onLogout}
           className="w-full py-4 border border-red-900/30 bg-red-900/5 text-red-500 hover:bg-red-900/10 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut size={18} /> Sair da Conta
        </button>
      </div>
      
      <div className="text-center pb-safe">
        <p className="text-[10px] text-agency-800 font-mono">REMAKING OS MOBILE v2.2</p>
      </div>
    </div>
  );
};

export default SettingsView;