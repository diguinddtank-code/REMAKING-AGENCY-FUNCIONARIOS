import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, CheckCircle2, Clock, DollarSign, Trophy, Check, Wallet, PieChart, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Task, Lead, Goal, StatCardProps, Financials } from '../types';

interface DashboardHomeProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>; 
  leads: Lead[];
  goals: Goal[];
  financials: Financials;
  setFinancials: React.Dispatch<React.SetStateAction<Financials>>;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, isPositive, icon: Icon }) => {
  let colorClass = "text-white";
  let bgClass = "bg-white/5";
  
  if (label === "MRR") { colorClass = "text-success-500"; bgClass = "bg-success-500/10"; }
  if (label === "Pendentes") { colorClass = "text-warning-500"; bgClass = "bg-warning-500/10"; }
  if (label === "Metas") { colorClass = "text-primary-500"; bgClass = "bg-primary-500/10"; }

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-agency-900 p-5 rounded-xl border border-agency-800 hover:border-agency-sub/30 transition-all min-w-[140px] group"
    >
      <div className="flex justify-between items-start mb-4">
         <p className="text-[10px] md:text-xs font-bold text-agency-sub uppercase tracking-widest">{label}</p>
         <div className={`p-1.5 rounded-lg ${bgClass}`}>
           <Icon size={16} className={colorClass} />
         </div>
      </div>
      
      <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</h3>
      
      {trend && (
        <div className={`flex items-center mt-3 text-[10px] font-bold ${isPositive ? 'text-white' : 'text-agency-sub'} w-fit px-2 py-1 rounded border border-white/5 bg-black/20 whitespace-nowrap`}>
          {trend}
        </div>
      )}
    </motion.div>
  );
};

const DashboardHome: React.FC<DashboardHomeProps> = ({ tasks, setTasks, leads, goals, financials, setFinancials }) => {
  const activeClients = leads.filter(l => l.status === 'Ativo');
  const monthlyRecurring = activeClients.reduce((acc, l) => acc + l.value, 0);
  
  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = tasks.filter(t => t.date === today);
  const sortedTasks = [...todaysTasks].sort((a, b) => Number(a.completed) - Number(b.completed));

  const pendingTasks = todaysTasks.filter(t => !t.completed);
  const completedToday = todaysTasks.filter(t => t.completed).length;
  
  const gymTasks = pendingTasks.filter(t => t.category === 'Academia').length;
  const workTasks = pendingTasks.filter(t => t.category === 'Trabalho').length;

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Trabalho': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Academia': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'Lembrete': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Financial Calculations
  const remaining = financials.salary - financials.expenses;
  const expensePercentage = financials.salary > 0 ? Math.min(100, Math.round((financials.expenses / financials.salary) * 100)) : 0;
  const isDanger = expensePercentage > 90;
  const isWarning = expensePercentage > 70;

  return (
    <div className="space-y-6 pb-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          label="MRR" 
          value={`R$ ${monthlyRecurring.toLocaleString('pt-BR', {notation: 'compact'})}`} 
          trend="Recorrente" 
          isPositive={true} 
          icon={DollarSign} 
        />
        <StatCard 
          label="Pendentes" 
          value={pendingTasks.length.toString()} 
          trend={`${gymTasks} Treino • ${workTasks} Trab`} 
          isPositive={true} 
          icon={Clock} 
        />
        <StatCard 
          label="Concluído" 
          value={completedToday.toString()} 
          trend="Produtividade" 
          isPositive={true} 
          icon={CheckCircle2} 
        />
        <StatCard 
          label="Metas" 
          value={goals.length.toString()} 
          trend="Desafios" 
          isPositive={true} 
          icon={Trophy} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content: Daily Routine */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-xl p-6 min-h-[400px]"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <CheckCircle2 size={20} className="text-primary-500" /> Rotina Diária
              </h3>
              <span className="text-xs font-bold text-primary-500 uppercase tracking-wider bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
              </span>
            </div>
            
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-agency-sub">
                <CheckCircle2 size={32} className="mb-4 opacity-20" />
                <p className="font-medium">Sem tarefas agendadas.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTasks.map((task) => {
                  return (
                    <motion.div 
                      layout
                      key={task.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
                        task.completed 
                          ? 'bg-agency-900/30 border-transparent opacity-40' 
                          : 'bg-agency-900 border-agency-800 hover:border-primary-500/30 hover:shadow-glow'
                      }`}
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          task.completed 
                            ? 'bg-success-500 border-success-500' 
                            : 'border-agency-sub hover:border-primary-500 bg-transparent'
                        }`}
                      >
                        {task.completed && <Check size={14} className="text-black" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm md:text-base font-semibold truncate ${task.completed ? 'text-agency-sub line-through' : 'text-white'}`}>
                          {task.text}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-agency-sub font-mono bg-black/50 px-2 py-0.5 rounded flex items-center gap-1">
                             <Clock size={10} /> {task.time}
                          </span>
                          <span className={`text-[10px] uppercase font-bold border px-2 py-0.5 rounded ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6 flex flex-col h-full">
          
          {/* New Financial Overview Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-agency-900 border border-agency-800 text-white rounded-xl p-6 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                 <Wallet size={18} className="text-warning-500" /> Fluxo de Caixa
              </h3>
              <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${isDanger ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-success-500/10 text-success-500 border-success-500/30'}`}>
                {remaining >= 0 ? 'Positivo' : 'Atenção'}
              </div>
            </div>

            <div className="space-y-4 mb-6">
               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold text-agency-sub tracking-wider flex items-center gap-1"><ArrowUpRight size={10} /> Entradas / Salário</label>
                 <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-agency-sub text-xs">R$</span>
                    <input 
                      type="number" 
                      value={financials.salary || ''} 
                      onChange={(e) => setFinancials({...financials, salary: Number(e.target.value)})}
                      placeholder="0.00"
                      className="w-full bg-black border border-agency-800 rounded-lg py-2 pl-8 pr-3 text-sm font-bold text-white focus:border-warning-500 outline-none transition-colors"
                    />
                 </div>
               </div>
               
               <div className="space-y-1">
                 <label className="text-[10px] uppercase font-bold text-agency-sub tracking-wider flex items-center gap-1"><TrendingDown size={10} /> Gastos Fixos Médios</label>
                 <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-agency-sub text-xs">R$</span>
                    <input 
                      type="number" 
                      value={financials.expenses || ''} 
                      onChange={(e) => setFinancials({...financials, expenses: Number(e.target.value)})}
                      placeholder="0.00"
                      className="w-full bg-black border border-agency-800 rounded-lg py-2 pl-8 pr-3 text-sm font-bold text-white focus:border-red-500 outline-none transition-colors"
                    />
                 </div>
               </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 border border-agency-800">
               <div className="flex justify-between items-end mb-1">
                  <span className="text-xs text-agency-sub font-medium">Sobra Prevista</span>
               </div>
               <div className={`text-3xl font-bold tracking-tighter ${remaining < 0 ? 'text-red-500' : 'text-success-500'}`}>
                 R$ {remaining.toLocaleString('pt-BR', { notation: "compact", maximumFractionDigits: 1 })}
               </div>
               
               <div className="mt-3">
                 <div className="flex justify-between text-[10px] text-agency-sub uppercase font-bold mb-1">
                   <span>Comprometido</span>
                   <span>{expensePercentage}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-agency-800 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, expensePercentage)}%` }}
                     className={`h-full rounded-full ${isDanger ? 'bg-red-500' : isWarning ? 'bg-warning-500' : 'bg-success-500'}`}
                   />
                 </div>
               </div>
            </div>
          </motion.div>


          {/* Active Clients Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-agency-800 text-white rounded-xl p-6 flex-1 relative overflow-hidden min-h-[300px]"
          >
             {/* Decorative blob */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10 border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold tracking-tight">Top Clientes</h3>
              <Users size={18} className="text-primary-500" />
            </div>
            
            {activeClients.length === 0 ? (
              <div className="text-center text-gray-500 py-10 relative z-10">
                <p className="text-sm">Sem dados.</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {activeClients
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3) // Reduced to 3 to fit
                  .map((lead, index) => (
                  <div key={lead.id} className="bg-white/5 p-4 rounded-lg flex justify-between items-center group cursor-default hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-agency-800 text-gray-400'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white truncate max-w-[100px]">{lead.name}</p>
                        <p className="text-xs text-agency-sub truncate max-w-[100px]">{lead.company}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                       <span className="text-sm font-mono font-bold text-success-500">
                        R$ {lead.value.toLocaleString('pt-BR', { notation: "compact", maximumFractionDigits: 1 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-auto pt-6 border-t border-white/10 relative z-10">
               <div className="flex justify-between items-end">
                 <div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-1 text-primary-500">LTV Projetado</div>
                    <div className="text-2xl font-bold tracking-tighter text-white">
                      R$ {(monthlyRecurring * 12).toLocaleString('pt-BR', {notation: "compact"})}
                    </div>
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;