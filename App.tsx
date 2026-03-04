import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Header from './components/Header';
import DashboardHome from './components/DashboardHome';
import CRMView from './components/CRMView';
import TasksView from './components/TasksView';
import GoalsView from './components/GoalsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import FinanceView from './components/FinanceView';
import { ViewState, Task, Lead, Goal, AppData, Financials, Transaction } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { supabase } from './lib/supabase';

// --- Database Helper Functions ---
const DB_KEY = 'vantage_db_v2';
const SUPABASE_USER_ID = 'default_user';

const getLocalDB = (): AppData => {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) return JSON.parse(stored);
  
  const oldDbStr = localStorage.getItem('vantage_db_v1');
  if (oldDbStr) {
    try {
      const oldDb = JSON.parse(oldDbStr);
      if (oldDb.lastUserEmail && oldDb.users[oldDb.lastUserEmail]) {
        const oldData = oldDb.users[oldDb.lastUserEmail].data;
        return { ...oldData, transactions: oldData.transactions || [] };
      }
    } catch (e) {}
  }
  
  return { tasks: [], leads: [], goals: [], financials: { salary: 0, expenses: 0 }, transactions: [] };
};

const saveLocalDB = (data: AppData) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

const fetchSupabaseDB = async (): Promise<AppData | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('id', SUPABASE_USER_ID)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, return null to trigger insert
        return null;
      }
      console.error('Error fetching from Supabase:', error);
      return null;
    }
    return data?.data as AppData;
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return null;
  }
};

const saveSupabaseDB = async (data: AppData) => {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ id: SUPABASE_USER_ID, data }, { onConflict: 'id' });
    if (error) console.error('Error saving to Supabase:', error);
  } catch (e) {
    console.error('Supabase save error:', e);
  }
};

// --- Default Tasks Logic ---
const generateDefaultTasks = (date: string): Task[] => [
  { id: `def-water-${Date.now()}`, text: "Ingerir 2L de água", completed: false, time: "08:00", category: "Lembrete", date },
  { id: `def-gym-${Date.now()}`, text: "Exercícios Físicos", completed: false, time: "18:00", category: "Academia", date },
  { id: `def-study-${Date.now()}`, text: "Estudo Diário", completed: false, time: "20:00", category: "Trabalho", date },
];

function App() {
  // --- App State ---
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [financials, setFinancials] = useState<Financials>({ salary: 0, expenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- Theme State ---
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // --- PWA Install State ---
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // --- Toast Notification State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // PWA Install Event Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent automatic mini-infobar
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- Check and Generate Daily Tasks for Clients ---
  const ensureDailyClientTasks = (currentTasks: Task[], currentLeads: Lead[]): Task[] => {
    const today = new Date().toISOString().split('T')[0];
    const activeClients = currentLeads.filter(l => l.status === 'Ativo');
    
    // Get existing task texts for today to avoid duplicates
    const existingTaskTexts = new Set(
      currentTasks
        .filter(t => t.date === today)
        .map(t => t.text)
    );

    const newClientTasks: Task[] = [];
    
    activeClients.forEach(client => {
      const taskText = `Otimizar: ${client.name}`;
      if (!existingTaskTexts.has(taskText)) {
        newClientTasks.push({
          id: `auto-client-${client.id}-${Date.now()}`,
          text: taskText,
          completed: false,
          time: '09:00',
          category: 'Trabalho',
          date: today
        });
      }
    });

    return [...newClientTasks, ...currentTasks];
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      let data = getLocalDB();
      
      if (supabase) {
        const remoteData = await fetchSupabaseDB();
        if (remoteData) {
          data = remoteData;
          saveLocalDB(data); // Sync local
        } else {
          // Initialize remote
          await saveSupabaseDB(data);
        }
      }
      
      let currentTasks = data.tasks || [];
      const currentLeads = data.leads || [];
      const today = new Date().toISOString().split('T')[0];

      // 1. Ensure Defaults (Water, Gym, Study)
      const hasDefaults = currentTasks.some(t => t.date === today && (t.text.includes("água") || t.text.includes("agua")));
      if (!hasDefaults) {
        const defaults = generateDefaultTasks(today);
        currentTasks = [...defaults, ...currentTasks];
      }

      // 2. Ensure Client Tasks (Otimizar: Cliente)
      currentTasks = ensureDailyClientTasks(currentTasks, currentLeads);

      setTasks(currentTasks);
      setLeads(currentLeads);
      setGoals(data.goals || []);
      setFinancials(data.financials || { salary: 0, expenses: 0 });
      setTransactions(data.transactions || []);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const data = { tasks, leads, goals, financials, transactions };
    saveLocalDB(data);
    
    // Debounce Supabase save to avoid too many requests
    const timeoutId = setTimeout(() => {
      saveSupabaseDB(data);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [tasks, leads, goals, financials, transactions, isLoading]);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      showToast('Aplicativo instalado com sucesso!', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-agency-black flex items-center justify-center">
         <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-agency-black' : 'bg-gray-100'} text-agency-text font-sans selection:bg-primary-500 selection:text-white overflow-hidden transition-colors duration-300`}>
      <Sidebar 
        activeView={activeView} 
        setView={setActiveView} 
        onInstallApp={handleInstallApp}
        canInstall={!!installPrompt}
      />
      
      <div className="flex-1 flex flex-col relative h-full">
        {/* Pass setView to Header for Mobile Navigation */}
        <Header title={activeView} setView={setActiveView} />
        
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
                {activeView === 'dashboard' && (
                  <DashboardHome 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    leads={leads} 
                    goals={goals} 
                    financials={financials}
                    setFinancials={setFinancials}
                    transactions={transactions}
                  />
                )}
                {activeView === 'crm' && <CRMView leads={leads} setLeads={setLeads} tasks={tasks} setTasks={setTasks} />}
                {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} />}
                {activeView === 'finance' && <FinanceView transactions={transactions} setTransactions={setTransactions} />}
                {activeView === 'goals' && <GoalsView goals={goals} setGoals={setGoals} />}
                {activeView === 'reports' && <ReportsView tasks={tasks} leads={leads} />}
                {activeView === 'settings' && (
                  <SettingsView 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    onInstallApp={handleInstallApp}
                    canInstall={!!installPrompt}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        
        <MobileNav 
          activeView={activeView} 
          setView={setActiveView} 
          onInstallApp={handleInstallApp}
          canInstall={!!installPrompt}
        />
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