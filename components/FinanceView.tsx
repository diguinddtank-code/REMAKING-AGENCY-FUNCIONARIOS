import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '../types';

interface FinanceViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinanceView: React.FC<FinanceViewProps> = ({ transactions, setTransactions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrans, setNewTrans] = useState<Partial<Transaction>>({ type: 'income' });

  const income = transactions.filter(t => t.type === 'income').reduce((acc, c) => acc + c.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, c) => acc + c.amount, 0);
  const balance = income - expense;

  const handleAddTransaction = () => {
    if (!newTrans.description || !newTrans.amount) return;
    const transaction: Transaction = {
      id: Date.now().toString(),
      description: newTrans.description,
      amount: Number(newTrans.amount),
      type: newTrans.type || 'income',
      date: new Date().toLocaleDateString('pt-BR'),
      category: 'Geral'
    };
    setTransactions([transaction, ...transactions]);
    setIsModalOpen(false);
    setNewTrans({ type: 'income' });
  };

  return (
    <div className="space-y-8">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-luxury-900 text-white p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-white/10 rounded-lg"><Wallet size={24} /></div>
             <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Total</span>
          </div>
          <p className="text-sm text-gray-300">Saldo Disponível</p>
          <h3 className="text-3xl font-bold mt-1">R$ {balance.toLocaleString('pt-BR')}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg"><ArrowUpRight size={18} /></div>
            <span className="text-sm font-semibold text-gray-600">Entradas</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">R$ {income.toLocaleString('pt-BR')}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg"><ArrowDownRight size={18} /></div>
            <span className="text-sm font-semibold text-gray-600">Saídas</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">R$ {expense.toLocaleString('pt-BR')}</h3>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-luxury-900 text-lg">Extrato</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold text-luxury-900 bg-luxury-50 px-3 py-2 rounded-xl hover:bg-luxury-100 transition-colors"
          >
            <Plus size={16} /> <span className="hidden md:inline">Nova Transação</span> <span className="md:hidden">Add</span>
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhuma transação registrada.</div>
          ) : (
            transactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <DollarSign size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{t.description}</p>
                    <p className="text-xs text-gray-400">{t.date} • {t.category}</p>
                  </div>
                </div>
                <span className={`font-bold ml-2 whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                </span>
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
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-3xl w-[95%] max-w-sm p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Nova Movimentação</h3>
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  {['income', 'expense'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewTrans({...newTrans, type: type as any})}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                        newTrans.type === type ? 'bg-white shadow-md text-luxury-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {type === 'income' ? 'Entrada' : 'Saída'}
                    </button>
                  ))}
                </div>
                <input 
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-luxury-900"
                  placeholder="Descrição (ex: Projeto X)"
                  value={newTrans.description || ''}
                  onChange={e => setNewTrans({...newTrans, description: e.target.value})}
                />
                <input 
                  type="number"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-luxury-900"
                  placeholder="Valor (R$)"
                  value={newTrans.amount || ''}
                  onChange={e => setNewTrans({...newTrans, amount: Number(e.target.value)})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-500 font-medium">Cancelar</button>
                <button onClick={handleAddTransaction} className="px-8 py-3 bg-luxury-900 text-white rounded-xl font-bold hover:bg-black shadow-lg shadow-luxury-900/20">Confirmar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceView;