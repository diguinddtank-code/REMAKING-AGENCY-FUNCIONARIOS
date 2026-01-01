import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BarChart3, CheckCircle2, TrendingUp, X } from 'lucide-react';
import { Task, Lead } from '../types';

interface DayStats {
  total: number;
  completed: number;
  score: number;
}

interface ReportsViewProps {
  tasks: Task[];
  leads: Lead[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ tasks, leads }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // --- Calendar Logic ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // --- Data Analysis ---
  const dailyStats = useMemo<Record<string, DayStats>>(() => {
    const stats: Record<string, DayStats> = {};
    
    // Initialize current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        stats[dateKey] = { total: 0, completed: 0, score: 0 };
    }

    tasks.forEach(task => {
      // Only count tasks for the currently viewed month (or allow global if key matches)
      if (stats[task.date]) {
        stats[task.date].total += 1;
        if (task.completed) stats[task.date].completed += 1;
      } else if (task.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
         // Fallback if loop didn't catch it (shouldn't happen with correct logic)
         stats[task.date] = { total: 1, completed: task.completed ? 1 : 0, score: 0 };
      }
    });

    // Calculate scores
    Object.keys(stats).forEach(key => {
        const day = stats[key];
        if (day.total > 0) {
            day.score = Math.round((day.completed / day.total) * 100);
        }
    });

    return stats;
  }, [tasks, year, month, daysInMonth]);

  // Monthly Overview Stats
  const dayStatsList = Object.values(dailyStats) as DayStats[];
  const monthlyTotalTasks = dayStatsList.reduce((acc, curr) => acc + curr.total, 0);
  const monthlyCompletedTasks = dayStatsList.reduce((acc, curr) => acc + curr.completed, 0);
  const monthlyRate = monthlyTotalTasks > 0 ? Math.round((monthlyCompletedTasks / monthlyTotalTasks) * 100) : 0;
  
  const perfectDays = dayStatsList.filter(d => d.total > 0 && d.score === 100).length;
  
  const mrr = leads.filter(l => l.status === 'Ativo').reduce((acc, l) => acc + l.value, 0);

  // --- Styles Helper ---
  const getDayStyles = (score: number, hasTasks: boolean) => {
    if (!hasTasks) return {
      container: 'bg-agency-900 border-agency-800',
      text: 'text-agency-sub',
      bar: 'bg-agency-800',
      glow: ''
    };

    if (score === 100) return {
      container: 'bg-gradient-to-br from-emerald-900/40 to-agency-900 border-emerald-500/50',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
      glow: 'shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]'
    };
    if (score >= 75) return {
      container: 'bg-gradient-to-br from-blue-900/40 to-agency-900 border-blue-500/50',
      text: 'text-blue-400',
      bar: 'bg-blue-500',
      glow: 'shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]'
    };
    if (score >= 50) return {
      container: 'bg-gradient-to-br from-violet-900/40 to-agency-900 border-violet-500/40',
      text: 'text-violet-400',
      bar: 'bg-violet-500',
      glow: 'shadow-[inset_0_0_20px_rgba(139,92,246,0.1)]'
    };
    if (score >= 25) return {
      container: 'bg-gradient-to-br from-amber-900/30 to-agency-900 border-amber-500/40',
      text: 'text-amber-500',
      bar: 'bg-amber-500',
      glow: ''
    };
    return {
      container: 'bg-gradient-to-br from-red-900/30 to-agency-900 border-red-500/40',
      text: 'text-red-500',
      bar: 'bg-red-500',
      glow: ''
    };
  };

  // --- Calendar Grid Generation ---
  const renderCalendarDays = () => {
    const days = [];
    
    // Padding for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`pad-${i}`} className="h-24 md:h-32 bg-transparent border border-agency-800/30 opacity-20"></div>);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const stat = dailyStats[dateKey] || { total: 0, completed: 0, score: 0 };
      const isToday = dateKey === new Date().toISOString().split('T')[0];
      
      const styles = getDayStyles(stat.score, stat.total > 0);
      
      const containerClasses = isToday 
        ? `${styles.container.split(' ')[0]} border-white ring-1 ring-white shadow-glow` 
        : `${styles.container} ${styles.glow} hover:border-agency-sub/50`;

      days.push(
        <motion.div 
          key={d}
          whileHover={{ scale: 0.98 }}
          onClick={() => setSelectedDate(dateKey)}
          className={`h-24 md:h-32 p-2 border rounded-lg cursor-pointer transition-all duration-300 flex flex-col justify-between relative overflow-hidden group ${containerClasses}`}
        >
           <div className="flex justify-between items-start relative z-10">
              <span className={`text-sm font-bold ${isToday ? 'bg-white text-black px-1.5 rounded' : styles.text}`}>{d}</span>
              {stat.score === 100 && <CheckCircle2 size={14} className="text-emerald-500" />}
           </div>

           {stat.total > 0 ? (
               <div className="mt-auto relative z-10">
                   <div className="flex justify-between items-center mb-1">
                      <span className={`text-[9px] uppercase font-bold ${styles.text} tracking-wider`}>
                        {stat.score}%
                      </span>
                   </div>
                   <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} 
                         style={{ width: `${stat.score}%` }}
                       />
                   </div>
               </div>
           ) : (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] text-agency-sub uppercase font-bold">Sem Registro</span>
               </div>
           )}
        </motion.div>
      );
    }
    return days;
  };

  const selectedDayTasks = tasks.filter(t => t.date === selectedDate);

  return (
    <div className="space-y-8 pb-24">
      {/* Header & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tighter mb-1">Relatórios</h2>
           <p className="text-agency-sub text-sm">Analise sua constância e evolução.</p>
        </div>

        <div className="flex items-center gap-4 bg-agency-900 p-2 rounded-lg border border-agency-800">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded text-white transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-sm font-bold uppercase tracking-widest text-white min-w-[140px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded text-white transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-agency-900 border border-agency-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-primary-600/20 text-primary-500 rounded-lg"><TrendingUp size={24} /></div>
              <div>
                  <p className="text-[10px] font-bold text-agency-sub uppercase tracking-widest">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-white">{monthlyRate}%</p>
              </div>
          </div>
          <div className="bg-agency-900 border border-agency-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-lg"><CheckCircle2 size={24} /></div>
              <div>
                  <p className="text-[10px] font-bold text-agency-sub uppercase tracking-widest">Dias Perfeitos</p>
                  <p className="text-2xl font-bold text-white">{perfectDays} <span className="text-sm text-agency-sub font-medium">dias</span></p>
              </div>
          </div>
          <div className="bg-agency-900 border border-agency-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-white/10 text-white rounded-lg"><BarChart3 size={24} /></div>
              <div>
                  <p className="text-[10px] font-bold text-agency-sub uppercase tracking-widest">Faturamento Ativo</p>
                  <p className="text-2xl font-bold text-white">R$ {mrr.toLocaleString('pt-BR', { notation: "compact" })}</p>
              </div>
          </div>
      </div>

      {/* Calendar View */}
      <div className="bg-black border border-agency-800 rounded-xl p-4 md:p-6 shadow-2xl">
         <div className="grid grid-cols-7 gap-2 mb-2 text-center">
             {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                 <div key={d} className="text-[10px] font-bold uppercase tracking-widest text-agency-sub py-2">{d}</div>
             ))}
         </div>
         <div className="grid grid-cols-7 gap-2">
             {renderCalendarDays()}
         </div>
      </div>

      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedDate && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => setSelectedDate(null)}
           >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
               className="bg-agency-900 border border-agency-800 rounded-xl w-full max-w-lg p-6 shadow-2xl relative"
               onClick={e => e.stopPropagation()}
             >
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-agency-800">
                    <div>
                        <h3 className="text-xl font-bold text-white">Detalhes do Dia</h3>
                        <p className="text-agency-sub text-xs uppercase tracking-widest">
                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                        </p>
                    </div>
                    <button onClick={() => setSelectedDate(null)} className="text-agency-sub hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {selectedDayTasks.length === 0 ? (
                        <div className="text-center py-8 text-agency-sub">
                            <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                            <p>Nenhuma tarefa registrada neste dia.</p>
                        </div>
                    ) : (
                        selectedDayTasks.map(task => (
                            <div key={task.id} className={`p-4 rounded border flex items-center gap-3 ${task.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black border-agency-800'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-agency-sub'}`}>
                                    {task.completed && <CheckCircle2 size={12} className="text-black" />}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium text-sm ${task.completed ? 'text-white' : 'text-agency-text'}`}>{task.text}</p>
                                    <p className="text-[10px] text-agency-sub uppercase tracking-wider mt-1">{task.category} • {task.time}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsView;