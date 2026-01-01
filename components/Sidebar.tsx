import React from 'react';
import { LayoutDashboard, Briefcase, CheckSquare, Target, Settings, LogOut, BarChart3, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewState, NavItem } from '../types';

interface SidebarProps {
  activeView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  onInstallApp?: () => void;
  canInstall?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'crm', label: 'Clientes & CRM', icon: Briefcase },
  { id: 'tasks', label: 'Tarefas & Agenda', icon: CheckSquare },
  { id: 'goals', label: 'Metas & Ações', icon: Target },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, onLogout, onInstallApp, canInstall }) => {
  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden lg:flex w-64 bg-agency-black border-r border-agency-800 h-screen flex-col text-white flex-shrink-0 z-50"
    >
      {/* Logo Area */}
      <div className="h-24 flex items-center justify-center px-6 border-b border-agency-800">
        <img 
          src="https://i.imgur.com/kL00omR.png" 
          alt="Remaking Agency" 
          className="max-h-12 w-auto object-contain" 
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-10 flex flex-col gap-1 px-4">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center justify-start p-4 rounded-lg transition-all duration-300 group ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-glow' 
                  : 'text-agency-sub hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className={`ml-4 text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="p-6 border-t border-agency-800">
        <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
               <button className="text-agency-sub hover:text-white transition-colors" title="Configurações">
                 <Settings size={20} strokeWidth={1.5} />
               </button>
               
               {canInstall && (
                 <button 
                   onClick={onInstallApp} 
                   className="text-primary-500 hover:text-white transition-colors animate-pulse" 
                   title="Instalar Aplicativo na Área de Trabalho"
                 >
                   <Download size={20} strokeWidth={1.5} />
                 </button>
               )}
            </div>

            <button 
              onClick={onLogout}
              className="text-agency-sub hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={20} strokeWidth={1.5} />
            </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold text-xs">US</div>
          <div className="text-left overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Usuário</p>
            <p className="text-[10px] text-success-500 uppercase tracking-widest font-bold">Online</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;