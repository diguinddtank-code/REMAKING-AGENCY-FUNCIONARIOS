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

    // Convert transactions date from YYYY-MM-DD to DD/MM/YYYY
    const formattedTransactions = (transactions.data || []).map((t: any) => {
      if (t.date && t.date.includes('-')) {
        const [y, m, d] = t.date.split('-');
        if (y.length === 4) {
          return { ...t, date: `${d}/${m}/${y}` };
        }
      }
      return t;
    });

    const sanitizedLeads = (leads.data || []).map((l: any) => ({
      ...l,
      payments: l.payments || {},
      reports: l.reports || []
    }));

    return {
      tasks: tasks.data || [],
      leads: sanitizedLeads,
      transactions: formattedTransactions,
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

      // 2. Identify deletions - DISABLED TO PREVENT ACCIDENTAL DATA LOSS
      // const toDelete = [...remoteIds].filter(id => !localIds.has(id));
      // if (toDelete.length > 0) {
      //   await supabase!.from(tableName).delete().in(idField, toDelete);
      // }

      // 3. Upsert local items (add user_id)
      if (localItems.length > 0) {
        const itemsWithUser = localItems.map(item => {
          const cleanItem = { ...item, user_id: userId };
          
          // Ensure created_at exists for new items to prevent not-null constraint errors
          if (!cleanItem.created_at) {
            cleanItem.created_at = new Date().toISOString();
          }
          
          if (tableName === 'transactions') {
            // Ensure isFixed is a boolean
            cleanItem.isFixed = !!cleanItem.isFixed;
            
            // Ensure category is set
            if (!cleanItem.category) {
              cleanItem.category = cleanItem.isFixed ? 'Fixo' : 'Geral';
            }

            // Convert DD/MM/YYYY to YYYY-MM-DD for Supabase DATE type
            if (cleanItem.date && cleanItem.date.includes('/')) {
               const parts = cleanItem.date.split('/');
               if (parts.length === 3) {
                 cleanItem.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
               }
            }
          }
          
          if (tableName === 'tasks') {
            delete cleanItem.repeat;
            delete cleanItem.parentId;
          }
          
          if (tableName === 'crm_leads') {
            // Ensure payments is an object (JSONB)
            if (!cleanItem.payments) cleanItem.payments = {};
            // Ensure reports is an array (JSONB)
            if (!cleanItem.reports) cleanItem.reports = [];
          }
          
          return cleanItem;
        });
        const { error } = await supabase!.from(tableName).upsert(itemsWithUser);
        if (error) {
          console.error(`Error syncing ${tableName}:`, error);
          throw new Error(`Erro na tabela ${tableName}: ${error.message || error.details || 'Erro desconhecido'}`);
        } else {
          console.log(`Synced ${tableName} successfully`, itemsWithUser);
        }
      }
    } catch (e: any) {
      console.error(`Sync error ${tableName}:`, e);
      throw e;
    }
  };

  try {
    await Promise.all([
      syncTable('tasks', data.tasks),
      syncTable('crm_leads', data.leads),
      syncTable('transactions', data.transactions),
      syncTable('goals', data.goals),
      // Financials is a single row per user
      supabase.from('financials').upsert({ 
        user_id: userId, 
        salary: data.financials.salary,
        expenses: data.financials.expenses
      }).then(({error}) => {
        if (error) throw new Error(`Erro na tabela financials: ${error.message}`);
      })
    ]);
  } catch (error: any) {
    throw error;
  }
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
            const isRemoteEmpty = 
              (!remoteData.tasks || remoteData.tasks.length === 0) && 
              (!remoteData.leads || remoteData.leads.length === 0) && 
              (!remoteData.transactions || remoteData.transactions.length === 0) && 
              (!remoteData.goals || remoteData.goals.length === 0);

            const isLocalEmpty = 
              (!localData.tasks || localData.tasks.length === 0) && 
              (!localData.leads || localData.leads.length === 0) && 
              (!localData.transactions || localData.transactions.length === 0) && 
              (!localData.goals || localData.goals.length === 0);

            if (isRemoteEmpty && !isLocalEmpty) {
              // Initial sync from local to remote
              finalData = localData;
              saveSupabaseRelational(finalData, session.user.id);
            } else {
              // Remote is source of truth
              finalData = remoteData;
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
      const timeoutId = setTimeout(async () => {
        try {
          console.log('Starting Supabase sync...', data);
          await saveSupabaseRelational(data, session.user.id);
          // showToast('Dados salvos na nuvem', 'success'); // Optional: feedback
        } catch (error: any) {
          showToast(error.message || 'Erro ao salvar na nuvem', 'error');
        }
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

  const forceSync = async () => {
    if (!session?.user) return;
    try {
      const remoteData = await fetchSupabaseRelational(session.user.id);
      if (remoteData) {
        let currentTasks = remoteData.tasks || [];
        const currentLeads = remoteData.leads || [];
        
        currentTasks = processRecurringTasks(currentTasks);

        setTasks(currentTasks);
        setLeads(currentLeads);
        setGoals(remoteData.goals || []);
        setFinancials(remoteData.financials || { salary: 0, expenses: 0 });
        setTransactions(remoteData.transactions || []);
        
        saveLocalDB(remoteData);
        showToast('Sincronizado com sucesso!', 'success');
      }
    } catch (error) {
      console.error("Error syncing data:", error);
      showToast('Erro ao sincronizar.', 'error');
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
        <Header title={activeView} setView={setActiveView} onSync={session ? forceSync : undefined} />
        
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