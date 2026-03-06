import React, { useState, useRef, useMemo } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Wallet, Trash2, Repeat, Upload, Filter, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

interface FinanceViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, setTransactions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({ type: 'income', isFixed: false });
  const [editingTrans, setEditingTrans] = useState<Transaction | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const parts = t.date.split('/');
      if (parts.length === 3) {
        months.add(`${parts[1]}/${parts[2]}`);
      }
    });
    return Array.from(months).sort((a, b) => {
      const [mA, yA] = a.split('/');
      const [mB, yB] = b.split('/');
      if (yA !== yB) return Number(yB) - Number(yA);
      return Number(mB) - Number(mA);
    });
  }, [transactions]);

  const formatMonth = (monthYear: string) => {
    const [m, y] = monthYear.split('/');
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => {
        const parts = t.date.split('/');
        if (parts.length === 3) {
          return `${parts[1]}/${parts[2]}` === selectedMonth;
        }
        return false;
      });
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.description.toLowerCase().includes(query));
    }

    return filtered;
  }, [transactions, selectedMonth, searchQuery]);

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
  const balance = income - expense;

  const handleAddTransaction = () => {
    if (!newTrans.description || !newTrans.amount) return;
    const transaction: Transaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: newTrans.description,
      amount: Number(newTrans.amount),
      type: newTrans.type || 'income',
      date: new Date().toLocaleDateString('pt-BR'),
      category: newTrans.isFixed ? 'Fixo' : 'Geral',
      isFixed: newTrans.isFixed
    };
    setTransactions([transaction, ...transactions]);
    setIsModalOpen(false);
    setNewTrans({ type: 'income', isFixed: false });
  };

  const handleEditTransaction = () => {
    if (!editingTrans || !editingTrans.description || !editingTrans.amount) return;
    setTransactions(transactions.map(t => t.id === editingTrans.id ? editingTrans : t));
    setEditingTrans(null);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleUploadExtrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = (event.target?.result as string).split(',')[1];
          let mimeType = file.type;
          if (!mimeType) {
            if (file.name.endsWith('.csv')) mimeType = 'text/csv';
            else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
            else mimeType = 'application/octet-stream';
          }

          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: "Extraia as transações deste extrato bancário. Retorne um array JSON onde cada item tem 'description' (string), 'amount' (number, positivo), 'type' (string, 'income' ou 'expense'), e 'date' (string, formato DD/MM/YYYY). Ignore saldos e transferências internas se possível.",
                },
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    type: { type: Type.STRING },
                    date: { type: Type.STRING },
                  },
                  required: ["description", "amount", "type", "date"],
                },
              },
            },
          });

          const jsonStr = response.text?.trim();
          if (jsonStr) {
            const parsedTransactions = JSON.parse(jsonStr);
            const newTransactions: Transaction[] = parsedTransactions.map((t: any) => ({
              id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9),
              description: t.description,
              amount: t.amount,
              type: t.type === 'income' ? 'income' : 'expense',
              date: t.date,
              category: 'Extrato',
              isFixed: false
            }));

            setTransactions(prev => [...newTransactions, ...prev]);
            alert(`${newTransactions.length} transações importadas com sucesso!`);
          }
        } catch (error) {
          console.error("Erro ao processar extrato:", error);
          alert("Erro ao processar o extrato. Verifique se o arquivo é suportado.");
        } finally {
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tighter mb-1">Financeiro</h2>
          <p className="text-agency-sub text-sm">Controle de entradas e saídas.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-agency-900 border border-agency-800 rounded-xl px-3 py-1.5 w-full sm:w-64">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-agency-sub flex-shrink-0"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Buscar transação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white text-sm outline-none font-medium w-full placeholder:text-agency-sub"
            />
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2 bg-agency-900 border border-agency-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
            <Filter size={16} className="text-agency-sub flex-shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white text-sm outline-none font-medium cursor-pointer appearance-none pr-4 w-full"
            >
              <option value="all" className="bg-agency-900">Todos os Meses</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m} className="bg-agency-900">{formatMonth(m)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-primary-600 text-white p-6 rounded-2xl shadow-glow">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-white/20 rounded-lg"><Wallet size={24} /></div>
             <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded uppercase tracking-wider">Total</span>
          </div>
          <p className="text-sm text-white/80 font-medium">Saldo Atual</p>
          <h3 className="text-3xl font-bold mt-1 tracking-tight">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="bg-agency-900 p-6 rounded-2xl border border-agency-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-success-500/10 text-success-500 rounded-lg"><ArrowUpRight size={18} /></div>
            <span className="text-sm font-bold text-agency-sub uppercase tracking-wider">Entradas</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="bg-agency-900 p-6 rounded-2xl border border-agency-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-red-500/10 text-red-500 rounded-lg"><ArrowDownRight size={18} /></div>
            <span className="text-sm font-bold text-agency-sub uppercase tracking-wider">Saídas</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-agency-900 rounded-2xl border border-agency-800 overflow-hidden">
        <div className="p-6 border-b border-agency-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-bold text-white text-lg">Extrato</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="flex items-center gap-2 text-sm font-bold text-white bg-agency-800 border border-agency-700 px-4 py-2 rounded-xl hover:bg-agency-700 transition-colors uppercase tracking-wider disabled:opacity-50"
            >
              {isParsing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />} 
              <span className="hidden md:inline">{isParsing ? 'Lendo...' : 'Importar Extrato'}</span>
              <span className="md:hidden">{isParsing ? '...' : 'Importar'}</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleUploadExtrato} 
              className="hidden" 
              accept="image/*,application/pdf,text/csv,.csv,.txt"
            />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-black bg-white px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider"
            >
              <Plus size={16} /> <span className="hidden md:inline">Nova Transação</span> <span className="md:hidden">Add</span>
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-agency-800">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-agency-sub font-medium">Nenhuma transação registrada.</div>
          ) : (
            filteredTransactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${t.type === 'income' ? 'bg-success-500/10 text-success-500' : 'bg-red-500/10 text-red-500'}`}>
                    <DollarSign size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate flex items-center gap-2">
                      {t.description}
                      {t.isFixed && <span className="text-[10px] bg-primary-500/20 text-primary-500 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"><Repeat size={10} /> Fixo</span>}
                    </p>
                    <p className="text-xs text-agency-sub font-medium">{t.date} • {t.category || 'Geral'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold whitespace-nowrap ${t.type === 'income' ? 'text-success-500' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingTrans(t)} className="text-agency-sub hover:text-white p-2">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-agency-sub hover:text-red-500 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

       {/* Add Transaction Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-agency-900 border border-agency-800 rounded-3xl w-[95%] max-w-sm p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 text-white">Nova Movimentação</h3>
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-black rounded-xl border border-agency-800">
                  {['income', 'expense'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewTrans({...newTrans, type: type as any})}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                        newTrans.type === type ? 'bg-agency-800 text-white' : 'text-agency-sub hover:text-white'
                      }`}
                    >
                      {type === 'income' ? 'Entrada' : 'Saída'}
                    </button>
                  ))}
                </div>
                <input 
                  className="w-full p-4 bg-black rounded-xl border border-agency-800 outline-none focus:border-primary-500 text-white placeholder:text-agency-sub font-medium"
                  placeholder="Descrição (ex: Projeto X)"
                  value={newTrans.description || ''}
                  onChange={e => setNewTrans({...newTrans, description: e.target.value})}
                />
                <input 
                  type="number"
                  className="w-full p-4 bg-black rounded-xl border border-agency-800 outline-none focus:border-primary-500 text-white placeholder:text-agency-sub font-medium"
                  placeholder="Valor (R$)"
                  value={newTrans.amount || ''}
                  onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value)})}
                />
                
                {newTrans.type === 'expense' && (
                  <div className="flex items-center gap-3 p-4 bg-black rounded-xl border border-agency-800 cursor-pointer group" onClick={() => setNewTrans({...newTrans, isFixed: !newTrans.isFixed})}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newTrans.isFixed ? 'bg-primary-500 border-primary-500' : 'border-agency-sub group-hover:border-primary-500'}`}>
                      {newTrans.isFixed && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                    <span className="text-sm font-bold text-white">Gasto Fixo Mensal</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-agency-sub font-bold uppercase tracking-wider hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleAddTransaction} className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-primary-500 shadow-glow transition-colors">Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* Edit Transaction Modal */}
       <AnimatePresence>
        {editingTrans && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-agency-900 border border-agency-800 rounded-3xl w-[95%] max-w-sm p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 text-white">Editar Movimentação</h3>
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-black rounded-xl border border-agency-800">
                  {['income', 'expense'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setEditingTrans({...editingTrans, type: type as any})}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                        editingTrans.type === type ? 'bg-agency-800 text-white' : 'text-agency-sub hover:text-white'
                      }`}
                    >
                      {type === 'income' ? 'Entrada' : 'Saída'}
                    </button>
                  ))}
                </div>
                <input 
                  className="w-full p-4 bg-black rounded-xl border border-agency-800 outline-none focus:border-primary-500 text-white placeholder:text-agency-sub font-medium"
                  placeholder="Descrição (ex: Projeto X)"
                  value={editingTrans.description || ''}
                  onChange={e => setEditingTrans({...editingTrans, description: e.target.value})}
                />
                <input 
                  type="number"
                  className="w-full p-4 bg-black rounded-xl border border-agency-800 outline-none focus:border-primary-500 text-white placeholder:text-agency-sub font-medium"
                  placeholder="Valor (R$)"
                  value={editingTrans.amount || ''}
                  onChange={e => setEditingTrans({...editingTrans, amount: Number(e.target.value)})}
                />
                
                {editingTrans.type === 'expense' && (
                  <div className="flex items-center gap-3 p-4 bg-black rounded-xl border border-agency-800 cursor-pointer group" onClick={() => setEditingTrans({...editingTrans, isFixed: !editingTrans.isFixed})}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editingTrans.isFixed ? 'bg-primary-500 border-primary-500' : 'border-agency-sub group-hover:border-primary-500'}`}>
                      {editingTrans.isFixed && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                    <span className="text-sm font-bold text-white">Gasto Fixo Mensal</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setEditingTrans(null)} className="px-6 py-3 text-agency-sub font-bold uppercase tracking-wider hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleEditTransaction} className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-primary-500 shadow-glow transition-colors">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceView;