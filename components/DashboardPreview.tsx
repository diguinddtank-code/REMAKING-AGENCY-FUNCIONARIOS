import React from 'react';
import { CheckCircle2, MoreHorizontal, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Task, Lead } from '../types';

const dummyTasks: Task[] = [
  { id: '1', text: "Revisão Trimestral", completed: true, time: "09:00", category: "Trabalho", date: new Date().toISOString().split('T')[0] },
  { id: '2', text: "Treino de Peito/Tríceps", completed: false, time: "18:30", category: "Academia", date: new Date().toISOString().split('T')[0] },
  { id: '3', text: "Pagar conta de luz", completed: false, time: "19:00", category: "Lembrete", date: new Date().toISOString().split('T')[0] },
];

const dummyLeads: Lead[] = [
  { id: '1', name: "Roberto Almeida", company: "Consultoria", status: "Ativo", value: 2500, lastContact: "Hoje" },
  { id: '2', name: "Sarah Jenkins", company: "Mentoria", status: "Potencial", value: 1200, lastContact: "Ontem" },
];

const DashboardPreview: React.FC = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto mt-16 md:mt-24 perspective-1000">
      <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 p-4">
        
        {/* Card 1: Tasks (Left Floating) */}
        <motion.div 
          className="md:col-span-4 bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50 z-20"
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -2 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          whileHover={{ y: -10, rotate: 0, transition: { duration: 0.3 } }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              Hoje
            </h3>
            <MoreHorizontal size={16} className="text-gray-400" />
          </div>
          <div className="space-y-4">
            {dummyTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 group cursor-pointer">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-luxury-900 border-luxury-900' : 'border-gray-300 group-hover:border-luxury-900'}`}>
                  {task.completed && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.text}</p>
                  <span className="text-xs text-gray-400">{task.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card 2: Main Stats (Center Focused) */}
        <motion.div 
          className="md:col-span-4 bg-luxury-900 text-white rounded-2xl p-6 shadow-2xl z-30"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1.05 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          whileHover={{ scale: 1.08 }}
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-gray-400 text-sm font-medium">Renda Recorrente</p>
              <h2 className="text-3xl font-bold mt-1">R$ 12.500</h2>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <TrendingUp size={20} className="text-green-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Meta Mensal</span>
                <span>85%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: '85%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-600 border-2 border-luxury-900 flex items-center justify-center text-xs">
                    <Users size={12}/>
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-300">+5 Clientes Ativos</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Leads (Right Floating) */}
        <motion.div 
          className="md:col-span-4 bg-white rounded-2xl p-6 shadow-soft border border-gray-100/50 z-20"
          initial={{ opacity: 0, y: 40, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 2 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
          whileHover={{ y: -10, rotate: 0, transition: { duration: 0.3 } }}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Clientes
            </h3>
            <span className="text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-full">Ativos</span>
          </div>
          <div className="space-y-4">
            {dummyLeads.map(lead => (
              <div key={lead.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">{lead.name}</span>
                  <span className="text-sm font-bold text-luxury-900">
                    {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs text-gray-500">{lead.company}</span>
                   <span className={`text-[10px] px-2 py-0.5 rounded-full ${lead.status === 'Negociacao' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                     {lead.status}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
      
      {/* Decorative Glow Behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/30 via-purple-100/30 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />
    </div>
  );
};

export default DashboardPreview;