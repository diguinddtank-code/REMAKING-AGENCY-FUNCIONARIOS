import React, { useState, useEffect, useRef } from 'react';
import { Check, Clock, Trash2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const TasksView: React.FC<TasksViewProps> = ({ tasks, setTasks }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Task['category']>('Trabalho');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const notifiedTasks = useRef(new Set<string>());
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      tasks.forEach(task => {
        if (task.completed || notifiedTasks.current.has(task.id)) return;
        const taskDateTime = new Date(`${task.date}T${task.time}`);
        const diffMs = taskDateTime.getTime() - now.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        if ((diffMinutes <= 10 && diffMinutes >= 0) || (diffMinutes < 0 && diffMinutes > -2)) {
          try {
            new Notification(`REMAKING: ${task.category}`, {
              body: diffMinutes <= 0 ? `HORA DE FAZER: ${task.text}` : `Faltam ${diffMinutes} min: "${task.text}"`,
              icon: 'https://i.imgur.com/kL00omR.png',
              tag: task.id,
              renotify: true,
              silent: false,
            } as any);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            notifiedTasks.current.add(task.id);
          } catch (error) { console.error("Erro notificação:", error); }
        }
      });
    };
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

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
      date: today,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      category: selectedCategory
    };
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const toggleTask = (id: string) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const filteredTasks = tasks.filter(t => {
    if (filter === 'today') return t.date === today;
    if (filter === 'pending') return !t.completed;
    return true;
  });

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

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tighter mb-1">Agenda</h2>
          <p className="text-agency-sub text-sm">Organize sua produtividade.</p>
        </div>
        {permission !== 'granted' && 'Notification' in window && (
          <button onClick={requestNotificationPermission} className="text-xs font-bold bg-primary-600 text-white px-4 py-2 rounded uppercase tracking-wider hover:bg-primary-500 transition-colors shadow-glow">
            Ativar Notificações
          </button>
        )}
      </div>

      {/* Agency Input Area */}
      <form onSubmit={handleAddTask} className="relative mb-8">
        <div className="relative bg-agency-900 p-2 rounded-lg border border-agency-800 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Zap size={18} className="text-primary-500" />
            </div>
            <input 
              type="text" 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Digite uma nova tarefa..." 
              className="w-full h-12 md:h-14 pl-11 pr-4 bg-transparent outline-none text-white placeholder:text-agency-sub/50 font-medium text-base md:text-lg"
            />
          </div>

          <div className="flex items-center gap-2 px-2 pb-2 md:pb-0 justify-between md:justify-end border-t border-agency-800 md:border-t-0 pt-2 md:pt-0">
             <div className="flex gap-1">
              {(['Trabalho', 'Academia', 'Lembrete'] as Task['category'][]).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-all border ${getCategoryColor(cat, selectedCategory === cat)}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <button 
              type="submit"
              disabled={showSuccess}
              className={`h-10 md:h-12 px-6 rounded flex items-center justify-center gap-2 transition-all duration-300 font-bold uppercase tracking-wide text-sm ${
                showSuccess ? 'bg-success-500 text-white' : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {showSuccess ? <motion.div key="c"><Check size={20} /></motion.div> : <motion.div key="p">ADD</motion.div>}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <div className="flex gap-2 mb-6 border-b border-agency-800 pb-2">
        {['all', 'today', 'pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              filter === f 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-agency-sub hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'today' ? 'Hoje' : 'Pendentes'}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-agency-sub">
               <p className="font-medium">Sem tarefas.</p>
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
                  task.completed ? 'border-agency-800 opacity-50' : 'border-agency-800 hover:border-primary-500/50'
                }`}
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center mr-4 transition-all duration-300 ${
                    task.completed ? 'bg-success-500 border-success-500' : 'border-agency-sub hover:border-primary-500'
                  }`}
                >
                  {task.completed && <Check size={12} className="text-black" />}
                </button>
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? 'text-agency-sub line-through' : 'text-white'}`}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-agency-sub">
                    <span className={`uppercase font-bold tracking-wider text-[10px] px-1.5 py-0.5 rounded border ${getCategoryTagStyle(task.category)}`}>{task.category}</span>
                    <span className="flex items-center gap-1 font-mono text-agency-sub"><Clock size={10} /> {task.time}</span>
                  </div>
                </div>

                <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-2 text-agency-sub hover:text-red-500 transition-all">
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