import React from 'react';
import { LayoutDashboard, Briefcase, CheckSquare, Target, BarChart3, Download } from 'lucide-react';
import { ViewState, NavItem } from '../types';

interface MobileNavProps {
  activeView: ViewState;
  setView: (view: ViewState) => void;
  onInstallApp?: () => void;
  canInstall?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'tasks', label: 'Agenda', icon: CheckSquare },
  { id: 'crm', label: 'CRM', icon: Briefcase },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'goals', label: 'Metas', icon: Target },
];

const MobileNav: React.FC<MobileNavProps> = ({ activeView, setView, onInstallApp, canInstall }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-agency-800 lg:hidden pb-[env(safe-area-inset-bottom)] transition-all duration-300">
      <div className="flex justify-between items-center h-[65px] px-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center justify-center h-full active:scale-95 transition-transform tap-highlight-transparent flex-1 ${canInstall ? 'min-w-[16%]' : 'min-w-[20%]'}`}
            >
              <div className={`p-1 transition-all duration-300 ${isActive ? 'text-primary-500 -translate-y-1' : 'text-agency-sub'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide transition-colors ${isActive ? 'text-white opacity-100' : 'text-agency-sub opacity-50'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              )}
            </button>
          );
        })}

        {/* PWA Install Button (Mobile) */}
        {canInstall && (
          <button
            onClick={onInstallApp}
            className="relative flex flex-col items-center justify-center min-w-[16%] flex-1 h-full active:scale-95 transition-transform tap-highlight-transparent"
          >
            <div className="p-1 text-primary-500 animate-pulse">
              <Download size={22} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-primary-500">
              Instalar
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileNav;