import React from 'react';
import { Search, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { ViewState } from '../types';

interface HeaderProps {
  title: string;
  setView: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ title, setView }) => {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="h-16 md:h-20 bg-agency-black/80 backdrop-blur-xl border-b border-agency-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 flex-shrink-0 pt-safe transition-all duration-300">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col justify-center"
      >
        <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight capitalize truncate max-w-[200px]">
          {title === 'dashboard' ? 'Visão Geral' : 
           title === 'settings' ? 'Ajustes' : title}
        </h1>
        <div className="flex items-center gap-2 text-[10px] md:text-xs text-agency-sub font-medium uppercase tracking-widest -mt-0.5">
          <span className="capitalize">{today}</span>
        </div>
      </motion.div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Search Bar (Hidden on Mobile) */}
        <div className="hidden md:flex items-center bg-agency-900 rounded-full px-4 py-2 w-64 border border-agency-800 focus-within:border-white/20 transition-all">
          <Search size={16} className="text-agency-sub" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-agency-800/50"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-agency-sub hover:text-white transition-colors active:scale-95">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
        </button>

        {/* Profile / Settings Button (Mobile Entry Point) */}
        <button 
          onClick={() => setView('settings')}
          className="relative w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-agency-800 to-agency-900 border border-agency-700 flex items-center justify-center active:scale-90 transition-transform shadow-lg group overflow-hidden"
        >
          <span className="font-bold text-xs text-white group-hover:scale-110 transition-transform">US</span>
          {/* Active Indicator */}
          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-success-500 border-2 border-agency-black rounded-full"></div>
        </button>
      </div>
    </header>
  );
};

export default Header;