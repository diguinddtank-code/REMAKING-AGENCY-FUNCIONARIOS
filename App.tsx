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
import AuthView from './components/AuthView';
import { ViewState, Task, Lead, Goal, AppData, Financials, Transaction } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- Database Helper Functions ---
const DB_KEY = 'vantage_db_v2';

const getLocalDB = (): AppData => {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) return JSON.parse(stored);
  return { tasks: [], leads: [], goals: [], financials: { salary: 0, expenses: 0 }, transactions: [] };
};

const saveLocalDB = (data: AppData) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// --- Relational Sync Functions ---
const fetchSupabaseRelational = async (userId: string): Promise<AppData | null> => {
  if (!supabase) return null;
  try {
    const [tasks, leads, transactions, goals, financials] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('crm_leads').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('financials').select('*').eq('user_id', userId).single()
    ]);

    return {
      tasks: tasks.data || [],
      leads: leads.data || [],
      transactions: transactions.data || [],
      goals: goals.data || [],
      financials: financials.data || { salary: 0, expenses: 0 }
    };
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return null;
  }
};

const saveSupabaseRelational = async (data: AppData, userId: string) => {
  if (!supabase) return;
  
  const syncTable = async (tableName: string, localItems: any[], idField = 'id') => {
    try {
      // 1. Get all remote IDs
      const { data: remoteItems } = await supabase!.from(tableName).select(idField).eq('user_id', userId);
      const remoteIds = new Set(remoteItems?.map((i: any) => i[idField]) || []);
      const localIds = new Set(localItems.map(i => i[idField]));

      // 2. Identify deletions
      const toDelete = [...remoteIds].filter(id => !localIds.has(id));
      if (toDelete.length > 0) {
        await supabase!.from(tableName).delete().in(idField, toDelete);
      }

      // 3. Upsert local items (add user_id)
      if (localItems.length > 0) {
        const itemsWithUser = localItems.map(item => ({ ...item, user_id: userId }));
        const { error } = await supabase!.from(tableName).upsert(itemsWithUser);
        if (error) console.error(`Error syncing ${tableName}:`, error);
      }
    } catch (e) {
      console.error(`Sync error ${tableName}:`, e);
    }
  };

  await Promise.all([
    syncTable('tasks', data.tasks),
    syncTable('crm_leads', data.leads),
    syncTable('transactions', data.transactions),
    syncTable('goals', data.goals),
    // Financials is a single row per user
    supabase.from('financials').upsert({ user_id: userId, ...data.financials })
  ]);
};

// --- Default Tasks Logic Removed ---
// const generateDefaultTasks = (date: string): Task[] => [ ... ];

function App() {
  // --- Auth State ---
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

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

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Process Recurring Tasks ---
  const processRecurringTasks = (currentTasks: Task[]): Task[] => {
    const today = new Date().toISOString().split('T')[0];
    const newTasks: Task[] = [];
    const processedIds = new Set(currentTasks.map(t => t.id));

    // Find tasks that need to recur
    currentTasks.forEach(task => {
      if (!task.repeat || task.repeat === 'none') return;
      
      // Check if we already have a task for today with this parentId (or is the original task on today)
      const hasInstanceToday = currentTasks.some(t => 
        t.date === today && (t.id === task.id || t.parentId === task.id || (task.parentId && t.parentId === task.parentId))
      );

      if (hasInstanceToday) return;

      // Check if it's time to recur
      const taskDate = new Date(task.date);
      const todayDate = new Date(today);
      
      // Only recur if original task is in the past
      if (taskDate >= todayDate) return;

      let shouldRecur = false;
      
      if (task.repeat === 'daily') {
        shouldRecur = true;
      } else if (task.repeat === 'weekly') {
        const diffTime = Math.abs(todayDate.getTime() - taskDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays % 7 === 0) shouldRecur = true;
      } else if (task.repeat === 'monthly') {
        if (todayDate.getDate() === taskDate.getDate()) shouldRecur = true;
      }

      if (shouldRecur) {
        newTasks.push({
          ...task,
          id: `recur-${task.id}-${Date.now()}`,
          date: today,
          completed: false,
          parentId: task.id // Link to original
        });
      }
    });

    return [...newTasks, ...currentTasks];
  };

  const [isLoading, setIsLoading] = useState(true);

  // Load Data Effect
  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      try {
        let localData = getLocalDB();
        let finalData = localData;
        
        if (session?.user) {
          const remoteData = await fetchSupabaseRelational(session.user.id);
          if (remoteData) {
            // Smart Merge: Combine local and remote data
            
            const mergeArrays = <T extends { id: string }>(localArr: T[], remoteArr: T[]) => {
              const map = new Map<string, T>();
              localArr.forEach(i => map.set(i.id, i));
              remoteArr.forEach(i => map.set(i.id, i));
              return Array.from(map.values());
            };

            // Financials Merge Logic
            let mergedFinancials = remoteData.financials;
            const localFin = localData.financials || { salary: 0, expenses: 0 };
            const remoteFin = remoteData.financials;

            if (localFin.updatedAt && remoteFin.updatedAt) {
              if (localFin.updatedAt > remoteFin.updatedAt) {
                mergedFinancials = localFin;
              }
            } else if (localFin.updatedAt && !remoteFin.updatedAt) {
               mergedFinancials = localFin;
            } else if (!localFin.updatedAt && !remoteFin.updatedAt) {
               if (remoteFin.salary === 0 && remoteFin.expenses === 0 && (localFin.salary > 0 || localFin.expenses > 0)) {
                  mergedFinancials = localFin;
               }
            }

            finalData = {
              tasks: mergeArrays(localData.tasks || [], remoteData.tasks || []),
              leads: mergeArrays(localData.leads || [], remoteData.leads || []),
              transactions: mergeArrays(localData.transactions || [], remoteData.transactions || []),
              goals: mergeArrays(localData.goals || [], remoteData.goals || []),
              financials: mergedFinancials
            };

            if (JSON.stringify(finalData) !== JSON.stringify(remoteData)) {
               saveSupabaseRelational(finalData, session.user.id);
            }
          }
        }
        
        let currentTasks = finalData.tasks || [];
        const currentLeads = finalData.leads || [];
        
        // Process Recurring Tasks
        currentTasks = processRecurringTasks(currentTasks);

        setTasks(currentTasks);
        setLeads(currentLeads);
        setGoals(finalData.goals || []);
        setFinancials(finalData.financials || { salary: 0, expenses: 0 });
        setTransactions(finalData.transactions || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [session, authLoading]);

  // Safety Timeout for Loading State
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading || authLoading) {
        console.warn("Force clearing loading state after timeout");
        setAuthLoading(false);
        setIsLoading(false);
      }
    }, 3000); // 3 seconds timeout
    return () => clearTimeout(timer);
  }, [isLoading, authLoading]);

  // Save Data Effect
  useEffect(() => {
    if (isLoading) return;
    const data = { tasks, leads, goals, financials, transactions };
    saveLocalDB(data);
    
    if (session?.user) {
      // Debounce Supabase save
      const timeoutId = setTimeout(() => {
        saveSupabaseRelational(data, session.user.id);
      }, 2000); // Increased debounce to 2s to reduce writes
      
      return () => clearTimeout(timeoutId);
    }
  }, [tasks, leads, goals, financials, transactions, isLoading, session]);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      showToast('Aplicativo instalado com sucesso!', 'success');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="h-screen w-screen bg-agency-black flex items-center justify-center">
         <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session && !isOffline) {
    return <AuthView onLogin={() => {}} onOffline={() => setIsOffline(true)} />;
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
                    onLogout={async () => {
                      await supabase?.auth.signOut();
                      setSession(null);
                      setIsOffline(false);
                    }}
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