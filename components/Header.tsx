import React from 'react';
import { Search, Bell, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="h-20 bg-agency-black/80 backdrop-blur-xl border-b border-agency-800 flex items-center justify-between px-6 md:px-8 sticky top-0 z-40 flex-shrink-0">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
      >
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight capitalize">{title === 'dashboard' ? 'Visão Geral' : title}</h1>
        <div className="flex items-center gap-2 text-[10px] md:text-xs text-agency-sub font-medium uppercase tracking-widest mt-1">
          <span className="capitalize">{today}</span>
        </div>
      </motion.div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Search Bar */}
        <div className="hidden md:flex items-center bg-agency-900 rounded-full px-4 py-2 w-64 border border-agency-800 focus-within:border-white/20 transition-all">
          <Search size={16} className="text-agency-sub" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-agency-800/50"
          />
        </div>

        {/* Icons */}
        <button className="md:hidden p-2 text-agency-sub hover:text-white">
           <Search size={20} />
        </button>

        <button className="relative p-2 text-agency-sub hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;