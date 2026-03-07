import React, { useState, useEffect, useRef } from 'react';
import { Check, Clock, Trash2, Zap, Trophy, Flame, Star, Target, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, setTasks }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskTime, setNewTaskTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [selectedCategory, setSelectedCategory] = useState<Task['category']>('Trabalho');
  const [selectedRepeat, setSelectedRepeat] = useState<Task['repeat']>('none');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Gamification State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [floatingXp, setFloatingXp] = useState<{ id: string, x: number, y: number, amount: number }[]>([]);
  
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedTasks = useRef(new Set<string>());
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Load Gamification Data
    const storedXp = localStorage.getItem('vantage_xp');
    const storedStreak = localStorage.getItem('vantage_streak');
    const lastActive = localStorage.getItem('vantage_last_active');
    
    if (storedXp) {
      const parsedXp = parseInt(storedXp, 10);
      setXp(parsedXp);
      setLevel(Math.floor(parsedXp / 100) + 1);
    }
    
    if (storedStreak && lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        setStreak(parseInt(storedStreak, 10));
      } else if (diffDays > 1) {
        setStreak(0);
        localStorage.setItem('vantage_streak', '0');
      } else {
        setStreak(parseInt(storedStreak, 10));
      }
    }
  }, [today]);

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText,
      completed: false,
      date: selectedDate, // Use selected date instead of always today
      time: newTaskTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category: selectedCategory,
      repeat: selectedRepeat
    };
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    setNewTaskTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const addXp = (amount: number) => {
    setXp(prev => {
      const newXp = Math.max(0, prev + amount);
      localStorage.setItem('vantage_xp', newXp.toString());
      setLevel(Math.floor(newXp / 100) + 1);
      return newXp;
    });
  };

  const updateStreak = () => {
    const lastActive = localStorage.getItem('vantage_last_active');
    if (lastActive !== today) {
      setStreak(prev => {
        const newStreak = prev + 1;
        localStorage.setItem('vantage_streak', newStreak.toString());
        return newStreak;
      });
      localStorage.setItem('vantage_last_active', today);
    }
  };

  const toggleTask = (id: string, e?: React.MouseEvent) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        // If task was failed, just reset it to pending without XP change (or maybe penalty reversal? let's keep it simple: reset)
        if (t.failed) {
            return { ...t, completed: false, failed: false };
        }

        const isCompleting = !t.completed;
        if (isCompleting) {
          addXp(10);
          updateStreak();
          if (e) {
            const newFloating = { id: Date.now().toString(), x: e.clientX, y: e.clientY, amount: 10 };
            setFloatingXp(prev => [...prev, newFloating]);
            setTimeout(() => {
              setFloatingXp(prev => prev.filter(f => f.id !== newFloating.id));
            }, 1000);
          }
        } else {
          addXp(-10);
        }
        return { ...t, completed: isCompleting, failed: false };
      }
      return t;
    }));
  };

  const failTask = (id: string, e?: React.MouseEvent) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        if (t.failed) return t; // Already failed

        // If it was completed, remove the XP gained
        if (t.completed) {
             addXp(-10);
        }

        // Apply penalty
        addXp(-20);
        
        if (e) {
            const newFloating = { id: Date.now().toString(), x: e.clientX, y: e.clientY, amount: -20 };
            setFloatingXp(prev => [...prev, newFloating]);
            setTimeout(() => {
              setFloatingXp(prev => prev.filter(f => f.id !== newFloating.id));
            }, 1000);
        }

        return { ...t, completed: false, failed: true };
      }
      return t;
    }));
  };
  
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const filteredTasks = tasks.filter(t => {
    if (filter === 'today') return t.date === today;
    if (filter === 'pending') return !t.completed && t.date === selectedDate;
    // Default 'all' filter now respects the selected date
    return t.date === selectedDate;
  });

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const todayDate = new Date(today + 'T00:00:00');
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    if (dateString === today) return 'Hoje';
    if (dateString === tomorrowDate.toISOString().split('T')[0]) return 'Amanhã';
    if (dateString === yesterdayDate.toISOString().split('T')[0]) return 'Ontem';

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCategoryColor = (cat: string, active: boolean) => {
    if (!active) return 'bg-transparent text-agency-sub border-agency-800 hover:text-white';
    switch (cat) {
      case 'Trabalho': return 'bg-blue-500 text-white border-blue-500 shadow-glow';
      case 'Academia': return 'bg-orange-500 text-white border-orange-500 shadow-glow';
      case 'Lembrete': return 'bg-purple-500 text-white border-purple-500 shadow-glow';
      default: return 'bg-white text-black';
    }
  };

  const getCategoryTagStyle = (cat: string) => {
      switch(cat) {
          case 'Trabalho': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
          case 'Academia': return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
          case 'Lembrete': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
          default: return 'text-gray-400 border-gray-400/30';
      }
  }

  const currentLevelXp = xp % 100;
  const progressPercentage = (currentLevelXp / 100) * 100;

  const addRoutine = () => {
    const routineTasks: Task[] = [
      {
        id: Date.now().toString() + '-1',
        text: 'Fazer exercícios físicos',
        completed: false,
        date: today,
        time: '07:00',
        category: 'Academia',
        repeat: 'daily'
      },
      {
        id: Date.now().toString() + '-2',
        text: 'Estudar 1h',
        completed: false,
        date: today,
        time: '20:00',
        category: 'Trabalho',
        repeat: 'daily'
      },
      {
        id: Date.now().toString() + '-3',
        text: 'Beber 2L de água',
        completed: false,
        date: today,
        time: '08:00',
        category: 'Lembrete',
        repeat: 'daily'
      }
    ];
    
    setTasks(prev => [...routineTasks, ...prev]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 relative">
      {/* Floating XP Animations */}
      <AnimatePresence>
        {floatingXp.map(fxp => (
            <motion.div
              key={fxp.id}
              initial={{ opacity: 1, y: fxp.y - 20, x: fxp.x - 20, scale: 0.5 }}
              animate={{ opacity: 0, y: fxp.y - 80, x: fxp.x - 20, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`fixed z-50 font-bold pointer-events-none text-xl drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] ${fxp.amount > 0 ? 'text-primary-500' : 'text-red-500'}`}
            >
              {fxp.amount > 0 ? '+' : ''}{fxp.amount} XP
            </motion.div>
        ))}
      </AnimatePresence>

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tighter mb-1">Missões Diárias</h2>
          <p className="text-agency-sub text-sm">Cumpra suas metas e suba de nível.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addRoutine} className="text-xs font-bold bg-agency-800 text-white px-4 py-2 rounded uppercase tracking-wider hover:bg-agency-700 transition-colors flex items-center gap-2">
            <Zap size={14} className="text-yellow-500" /> Rotina Boa
          </button>
          {permission !== 'granted' && 'Notification' in window && (
            <button onClick={requestNotificationPermission} className="text-xs font-bold bg-primary-600 text-white px-4 py-2 rounded uppercase tracking-wider hover:bg-primary-500 transition-colors shadow-glow">
              Ativar Notificações
            </button>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-black/40 border border-agency-800 rounded-lg p-2 mb-6">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-agency-800 rounded-md transition-colors text-agency-sub hover:text-white">
            <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2 relative group">
            <div className="flex items-center gap-2 cursor-pointer">
                <CalendarIcon size={16} className="text-primary-500" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {formatDateDisplay(selectedDate)}
                </span>
            </div>
            
            {/* Hidden Date Input that covers the text/icon for clicking */}
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />

            {selectedDate !== today && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent opening date picker
                        setSelectedDate(today);
                    }}
                    className="ml-2 text-[10px] bg-agency-800 px-2 py-0.5 rounded text-agency-sub hover:text-white transition-colors relative z-20"
                >
                    Voltar para Hoje
                </button>
            )}
        </div>

        <button onClick={() => changeDate(1)} className="p-2 hover:bg-agency-800 rounded-md transition-colors text-agency-sub hover:text-white">
            <ChevronRight size={20} />
        </button>
      </div>

      {/* Gamification Header */}
      <div className="bg-agency-900 border border-agency-800 rounded-xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Level Badge */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-black border-4 border-primary-500 flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.3)] relative z-10">
            <div className="text-center">
              <span className="block text-[10px] font-bold text-primary-500 uppercase tracking-widest leading-none mb-1">Nível</span>
              <span className="block text-3xl font-black text-white leading-none">{level}</span>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-agency-900 rounded-full p-1.5 border border-agency-800 z-20">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
          </div>
        </div>

        {/* Progress & Stats */}
        <div className="flex-1 w-full z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy size={18} className="text-primary-500" />
                Progresso
              </h3>
              <p className="text-xs text-agency-sub font-mono">{xp} XP Total</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">{currentLevelXp}</span>
              <span className="text-xs text-agency-sub"> / 100 XP</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-agency-800 mb-4">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary-600 to-yellow-500 relative"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -skew-x-12 translate-x-[-100%]"></div>
            </motion.div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 bg-black/50 border border-agency-800 rounded-lg px-3 py-2 inline-flex">
            <Flame size={16} className={streak > 0 ? "text-orange-500 fill-orange-500" : "text-agency-sub"} />
            <span className="text-xs font-bold uppercase tracking-wider text-agency-sub">
              Ofensiva: <span className={streak > 0 ? "text-orange-500" : "text-white"}>{streak} dias</span>
            </span>
          </div>
        </div>
      </div>

      {/* Agency Input Area */}
      <form onSubmit={handleAddTask} className="relative mb-8">
        <div className="relative bg-agency-900 p-2 rounded-lg border border-agency-800 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Target size={18} className="text-primary-500" />
            </div>
            <input 
              type="text" 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Adicionar nova missão..." 
              className="w-full h-12 md:h-14 pl-11 pr-4 bg-transparent outline-none text-white placeholder:text-agency-sub/50 font-medium text-base md:text-lg"
            />
          </div>

          <div className="flex flex-col gap-3 px-2 pb-2">
             {/* Toolbar Row 1: Time & Recurrence */}
             <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <div className="flex items-center gap-2 bg-black/40 border border-agency-800 rounded px-2 py-1.5">
                  <Clock size={14} className="text-agency-sub" />
                  <input 
                    type="time" 
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="bg-transparent text-white text-xs font-bold outline-none w-20"
                  />
                </div>

                <div className="h-6 w-px bg-agency-800 mx-1"></div>

                <select
                  value={selectedRepeat}
                  onChange={(e) => setSelectedRepeat(e.target.value as any)}
                  className="bg-black/40 text-agency-sub text-[10px] font-bold uppercase tracking-wider border border-agency-800 rounded px-2 py-2 outline-none focus:border-primary-500 hover:text-white transition-colors cursor-pointer"
                >
                  <option value="none">Repetir: Não</option>
                  <option value="daily">Repetir: Diária</option>
                  <option value="weekly">Repetir: Semanal</option>
                  <option value="monthly">Repetir: Mensal</option>
                </select>
             </div>

             {/* Toolbar Row 2: Categories & Submit */}
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between border-t border-agency-800 pt-2">
                <div className="flex flex-wrap gap-1">
                  {(['Trabalho', 'Academia', 'Lembrete'] as Task['category'][]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${getCategoryColor(cat, selectedCategory === cat)}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <button 
                  type="submit"
                  disabled={showSuccess}
                  className={`w-full sm:w-auto h-10 px-6 rounded flex items-center justify-center gap-2 transition-all duration-300 font-bold uppercase tracking-wide text-sm ${
                    showSuccess ? 'bg-success-500 text-white' : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {showSuccess ? <motion.div key="c"><Check size={20} /></motion.div> : <motion.div key="p">CRIAR MISSÃO</motion.div>}
                  </AnimatePresence>
                </button>
             </div>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-agency-800 pb-2">
        {['all', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              filter === f 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-agency-sub hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todas' : 'Pendentes'}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-agency-sub">
               <p className="font-medium">Nenhuma missão encontrada.</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`group flex items-center p-4 bg-black rounded border transition-all duration-300 ${
                  task.completed 
                    ? 'border-agency-800 opacity-50' 
                    : task.failed 
                        ? 'border-red-500/50 bg-red-500/5' 
                        : 'border-agency-800 hover:border-primary-500/50 hover:shadow-[0_0_15px_rgba(242,125,38,0.1)]'
                }`}
              >
                <div className="flex flex-col gap-1 mr-3 sm:mr-4">
                    <button 
                    onClick={(e) => toggleTask(task.id, e)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                        task.completed ? 'bg-success-500 border-success-500' : 'border-agency-sub hover:border-primary-500'
                    }`}
                    >
                    {task.completed && <Check size={14} className="text-black" />}
                    </button>
                    
                    {!task.completed && !task.failed && (
                        <button 
                            onClick={(e) => failTask(task.id, e)}
                            className="flex-shrink-0 w-6 h-6 rounded border-2 border-agency-sub hover:border-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all duration-300 group/fail"
                            title="Falhar Missão (-20 XP)"
                        >
                            <X size={14} className="text-agency-sub group-hover/fail:text-red-500" />
                        </button>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium break-words transition-colors ${
                      task.completed ? 'text-agency-sub line-through' : task.failed ? 'text-red-500 line-through' : 'text-white'
                    }`}>
                    {task.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-agency-sub">
                    <span className={`uppercase font-bold tracking-wider text-[10px] px-1.5 py-0.5 rounded border ${getCategoryTagStyle(task.category)}`}>{task.category}</span>
                    <span className="flex items-center gap-1 font-mono text-agency-sub whitespace-nowrap"><Clock size={10} /> {task.time}</span>
                    {task.repeat && task.repeat !== 'none' && (
                      <span className="flex items-center gap-1 font-mono text-primary-500 whitespace-nowrap border border-primary-500/30 bg-primary-500/10 px-1.5 py-0.5 rounded uppercase text-[9px]">
                        {task.repeat === 'daily' ? 'Diária' : task.repeat === 'weekly' ? 'Semanal' : 'Mensal'}
                      </span>
                    )}
                    {task.failed && (
                        <span className="font-bold text-red-500 text-[10px] uppercase tracking-wider border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded">
                            Falhou
                        </span>
                    )}
                    {!task.completed && !task.failed && (
                      <span className="flex items-center gap-1 font-mono text-yellow-500 whitespace-nowrap ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        +10 XP
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={() => deleteTask(task.id)} className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-agency-sub hover:text-red-500 transition-all flex-shrink-0 ml-2">
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TasksView;