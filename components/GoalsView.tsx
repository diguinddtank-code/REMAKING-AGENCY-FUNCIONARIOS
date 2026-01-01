import React, { useState } from 'react';
import { Target, Plus, Zap, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '../types';

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const GoalsView: React.FC<GoalsViewProps> = ({ goals, setGoals }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({});

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetValue) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetValue: Number(newGoal.targetValue),
      currentValue: Number(newGoal.currentValue) || 0,
      deadline: newGoal.deadline || '2024-12-31',
      unit: newGoal.unit || 'vezes'
    };
    setGoals([...goals, goal]);
    setIsModalOpen(false);
    setNewGoal({});
  };

  const updateProgress = (id: string, amount: number) => {
     setGoals(goals.map(g => {
       if (g.id === id) {
         const newVal = Math.min(g.targetValue, g.currentValue + amount);
         return { ...g, currentValue: newVal };
       }
       return g;
     }));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tighter">Desafios</h2>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-6 py-3 rounded font-bold hover:bg-primary-500 transition-all flex items-center justify-center gap-2 w-full md:w-auto uppercase tracking-wider text-sm shadow-glow"
        >
          <Plus size={16} /> Novo Desafio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
          const isCompleted = progress === 100;

          return (
            <motion.div 
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-xl border flex flex-col relative overflow-hidden transition-all ${
                isCompleted 
                  ? 'bg-gradient-to-br from-success-500/10 to-black text-white border-success-500' 
                  : 'bg-agency-900 border-agency-800 hover:border-primary-500/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2 rounded ${isCompleted ? 'bg-success-500 text-black' : 'bg-primary-500/10 text-primary-500'}`}>
                  {isCompleted ? <Trophy size={18} /> : <Zap size={18} />}
                </div>
              </div>
              
              <h3 className={`text-xl font-bold mb-1 tracking-tight ${isCompleted ? 'text-success-500' : 'text-white'}`}>
                {goal.title}
              </h3>
              <p className={`text-xs font-mono mb-6 ${isCompleted ? 'text-gray-400' : 'text-gray-400'}`}>
                {goal.currentValue} / {goal.targetValue} {goal.unit}
              </p>

              <div className="mt-auto relative z-10">
                <div className={`h-2 w-full bg-black rounded-full mb-4 overflow-hidden border border-agency-800`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${isCompleted ? 'bg-success-500' : 'bg-gradient-to-r from-primary-600 to-purple-600'}`}
                  />
                </div>
                
                {!isCompleted ? (
                   <button 
                     onClick={() => updateProgress(goal.id, 1)}
                     className="w-full py-3 bg-black border border-agency-800 text-white rounded font-bold hover:bg-agency-800 hover:text-primary-500 hover:border-primary-500 transition-colors uppercase text-xs tracking-wider"
                   >
                     Registrar +1
                   </button>
                ) : (
                   <div className="py-2 text-center text-xs font-bold text-success-500 border border-success-500/20 rounded bg-success-500/10 uppercase tracking-widest">
                     Concluído
                   </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {goals.length === 0 && (
          <div 
            onClick={() => setIsModalOpen(true)}
            className="border border-dashed border-agency-800 rounded-xl flex flex-col items-center justify-center p-8 text-agency-sub hover:border-primary-500 hover:text-primary-500 cursor-pointer transition-all min-h-[250px] bg-agency-900/20"
          >
            <Flame size={48} className="mb-4 opacity-20" />
            <span className="font-bold uppercase tracking-wider text-sm">Criar Desafio</span>
          </div>
        )}
      </div>

       {/* Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-agency-900 border border-agency-800 rounded-xl w-[95%] max-w-sm p-6 shadow-2xl relative"
            >
              <h3 className="text-xl font-bold mb-6 text-white uppercase tracking-wide">Novo Desafio</h3>
              
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-agency-sub uppercase tracking-widest">Objetivo</label>
                    <input className="w-full p-3 bg-black border border-agency-800 rounded outline-none text-white text-sm focus:border-primary-500" placeholder="Ex: Correr 50km" value={newGoal.title || ''} onChange={e => setNewGoal({...newGoal, title: e.target.value})} />
                 </div>
                 <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                       <label className="text-[10px] font-bold text-agency-sub uppercase tracking-widest">Meta</label>
                       <input type="number" className="w-full p-3 bg-black border border-agency-800 rounded outline-none text-white text-sm font-mono focus:border-primary-500" placeholder="50" value={newGoal.targetValue || ''} onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})} />
                    </div>
                    <div className="flex-1 space-y-1">
                       <label className="text-[10px] font-bold text-agency-sub uppercase tracking-widest">Unidade</label>
                       <input className="w-full p-3 bg-black border border-agency-800 rounded outline-none text-white text-sm focus:border-primary-500" placeholder="km" value={newGoal.unit || ''} onChange={e => setNewGoal({...newGoal, unit: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-agency-800">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-agency-sub text-xs font-bold uppercase hover:text-white">Cancelar</button>
                <button onClick={handleAddGoal} className="px-6 py-3 bg-primary-600 text-white rounded font-bold hover:bg-primary-500 text-xs uppercase tracking-wide shadow-glow">Criar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalsView;