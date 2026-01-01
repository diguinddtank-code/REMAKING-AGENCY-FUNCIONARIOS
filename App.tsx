import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import CRMView from './components/CRMView';
import TasksView from './components/TasksView';
import GoalsView from './components/GoalsView';
import ReportsView from './components/ReportsView';
import AuthScreen from './components/AuthScreen';
import { ViewState, Task, Lead, Goal, User, DatabaseSchema } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

// --- Database Helper Functions ---
const DB_KEY = 'vantage_db_v1';

const getDB = (): DatabaseSchema => {
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : { users: {} };
};

const saveDB = (db: DatabaseSchema) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// --- Default Tasks Logic ---
const generateDefaultTasks = (date: string): Task[] => [
  { id: `def-water-${Date.now()}`, text: "Ingerir 2L de água", completed: false, time: "08:00", category: "Lembrete", date },
  { id: `def-gym-${Date.now()}`, text: "Exercícios Físicos", completed: false, time: "18:00", category: "Academia", date },
  { id: `def-study-${Date.now()}`, text: "Estudo Diário", completed: false, time: "20:00", category: "Trabalho", date },
];

function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // --- App State ---
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // --- Toast Notification State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const db = getDB();
    if (db.lastUserEmail && db.users[db.lastUserEmail]) {
      const userData = db.users[db.lastUserEmail];
      setUser(userData.user);
      setIsAuthenticated(true);
      
      // Merge stored tasks with defaults if they don't exist for today
      let currentTasks = userData.data.tasks || [];
      const today = new Date().toISOString().split('T')[0];
      const hasDefaults = currentTasks.some(t => t.date === today && (t.text.includes("água") || t.text.includes("agua")));
      
      if (!hasDefaults) {
        const defaults = generateDefaultTasks(today);
        currentTasks = [...defaults, ...currentTasks];
      }

      setTasks(currentTasks);
      setLeads(userData.data.leads || []);
      setGoals(userData.data.goals || []);
    }
    setTimeout(() => setIsAuthChecking(false), 500);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const db = getDB();
    if (db.users[user.email]) {
      db.users[user.email].data = { tasks, leads, goals };
      saveDB(db);
    }
  }, [tasks, leads, goals, isAuthenticated, user]);

  const handleLogin = (email: string, pass: string): boolean => {
    const db = getDB();
    const targetUser = db.users[email];
    if (targetUser && targetUser.password === pass) {
      setUser(targetUser.user);
      
      // Ensure defaults exist on login
      let currentTasks = targetUser.data.tasks || [];
      const today = new Date().toISOString().split('T')[0];
      const hasDefaults = currentTasks.some(t => t.date === today && (t.text.includes("água") || t.text.includes("agua")));
      
      if (!hasDefaults) {
         const defaults = generateDefaultTasks(today);
         currentTasks = [...defaults, ...currentTasks];
      }

      setTasks(currentTasks);
      setLeads(targetUser.data.leads);
      setGoals(targetUser.data.goals);
      db.lastUserEmail = email;
      saveDB(db);
      setIsAuthenticated(true);
      showToast(`Bem-vindo, ${targetUser.user.name.split(' ')[0]}`, 'success');
      return true;
    }
    return false;
  };

  const handleRegister = (name: string, email: string, pass: string): boolean => {
    const db = getDB();
    if (db.users[email]) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const defaultTasks = generateDefaultTasks(today);

    const newUser: User = { name, email };
    db.users[email] = {
      password: pass,
      user: newUser,
      data: { tasks: defaultTasks, leads: [], goals: [] }
    };
    db.lastUserEmail = email;
    saveDB(db);
    setUser(newUser);
    setTasks(defaultTasks);
    setLeads([]);
    setGoals([]);
    setIsAuthenticated(true);
    showToast('Acesso concedido. Rotina iniciada.', 'success');
    return true;
  };

  const handleLogout = () => {
    const db = getDB();
    db.lastUserEmail = undefined;
    saveDB(db);
    setIsAuthenticated(false);
    setUser(null);
    setTasks([]);
    setLeads([]);
    setGoals([]);
    showToast('Sessão encerrada.', 'success');
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-agency-black flex items-center justify-center">
         <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />
        <ToastContainer toast={toast} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-agency-black text-agency-text font-sans selection:bg-primary-500 selection:text-white overflow-hidden">
      <Sidebar activeView={activeView} setView={setActiveView} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col relative h-full">
        <Header title={activeView} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth pb-28 lg:pb-8 pt-4">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeView === 'dashboard' && <DashboardHome tasks={tasks} setTasks={setTasks} leads={leads} goals={goals} />}
                {activeView === 'crm' && <CRMView leads={leads} setLeads={setLeads} tasks={tasks} setTasks={setTasks} />}
                {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} />}
                {activeView === 'goals' && <GoalsView goals={goals} setGoals={setGoals} />}
                {activeView === 'reports' && <ReportsView tasks={tasks} leads={leads} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        
        <MobileNav activeView={activeView} setView={setActiveView} />
        <ToastContainer toast={toast} />
      </div>
    </div>
  );
}

const ToastContainer = ({ toast }: { toast: { message: string, type: 'success' | 'error' } | null }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 32, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className={`fixed top-0 left-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
            toast.type === 'success' 
              ? 'bg-success-500/10 text-success-500 border-success-500/50' 
              : 'bg-red-500/10 text-red-500 border-red-900'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default App;