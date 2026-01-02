import React, { useState } from 'react';
import { Plus, Building2, Trash2, Wallet, Users, LayoutList, FileText, X, User, DollarSign, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, Task } from '../types';

interface CRMViewProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const CRMView: React.FC<CRMViewProps> = ({ leads, setLeads, tasks, setTasks }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState<Partial<Lead>>({ status: 'Potencial' });
  const [activeMobileTab, setActiveMobileTab] = useState<Lead['status']>('Ativo');
  
  const [editingNoteLead, setEditingNoteLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');

  const columns: { id: Lead['status']; label: string; color: string; borderColor: string; }[] = [
    { id: 'Potencial', label: 'Interesse', color: 'text-blue-400', borderColor: 'border-blue-500/30' },
    { id: 'Negociacao', label: 'Negociando', color: 'text-warning-500', borderColor: 'border-warning-500/30' },
    { id: 'Ativo', label: 'Ativos', color: 'text-success-500', borderColor: 'border-success-500/30' },
    { id: 'Arquivado', label: 'Arquivados', color: 'text-gray-500', borderColor: 'border-gray-500/30' },
  ];

  const monthlyRevenue = leads
    .filter(l => l.status === 'Ativo')
    .reduce((acc, curr) => acc + curr.value, 0);

  const activeClientsCount = leads.filter(l => l.status === 'Ativo').length;

  const handleAddLead = () => {
    if (!newLead.name || !newLead.value || newLead.value <= 0) return;
    const lead: Lead = {
      id: Date.now().toString(),
      name: newLead.name,
      company: newLead.company || 'Pessoal',
      value: Number(newLead.value),
      status: 'Potencial',
      lastContact: new Date().toLocaleDateString('pt-BR'),
      phone: newLead.phone || '',
      notes: '',
      payments: {}
    };
    const newTask: Task = {
      id: `auto-task-${Date.now()}`,
      text: `Otimizar: ${newLead.name}`,
      completed: false,
      date: new Date().toISOString().split('T')[0], 
      time: '09:00', 
      category: 'Trabalho'
    };
    setLeads([...leads, lead]);
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setIsModalOpen(false);
    setNewLead({ status: 'Potencial' });

    // Trigger Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("REMAKING", {
          body: `Novo cliente cadastrado com sucesso: ${lead.name}`,
          icon: 'https://i.imgur.com/kL00omR.png'
        });
      } catch (e) { console.log("Notificação falhou", e); }
    }
  };

  const deleteLead = (id: string) => setLeads(leads.filter(l => l.id !== id));
  const moveLead = (id: string, newStatus: Lead['status']) => setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
  
  const openNoteModal = (lead: Lead) => {
    setEditingNoteLead(lead);
    setNoteText(lead.notes || '');
  };

  const saveNote = () => {
    if (editingNoteLead) {
      setLeads(leads.map(l => l.id === editingNoteLead.id ? { ...l, notes: noteText } : l));
      setEditingNoteLead(null);
      setNoteText('');
    }
  };

  const togglePayment = (leadId: string) => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    setLeads(leads.map(l => {
        if (l.id !== leadId) return l;
        
        const currentStatus = l.payments?.[currentMonthKey] || 'Pending';
        const newStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
        
        return { 
            ...l, 
            payments: { 
                ...l.payments, 
                [currentMonthKey]: newStatus 
            } 
        };
    }));
  };

  return (
    <div className="h-full flex flex-col pb-safe w-full max-w-full overflow-x-hidden">
      
      {/* SECTION 1: HEADER (STATS) */}
      <div className="w-full bg-agency-900 border border-agency-800 text-white rounded-xl p-6 mb-6 flex flex-col gap-4 relative overflow-hidden shrink-0">
         {/* Glow effect */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 w-full flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
          <div className="w-full bg-black/40 border border-agency-800 rounded-lg p-4 flex items-center gap-3">
             <div className="p-2 bg-success-500/20 text-success-500 rounded shrink-0"><Wallet size={18} /></div>
             <div className="flex-1 min-w-0">
               <p className="text-agency-sub text-[10px] uppercase tracking-wide font-bold truncate">MRR</p>
               <h2 className="text-xl font-bold tracking-tight truncate text-white">
                 R$ {monthlyRevenue.toLocaleString('pt-BR', { notation: "compact", maximumFractionDigits: 1 })}
               </h2>
             </div>
          </div>
          
          <div className="w-full bg-black/40 border border-agency-800 rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-500 rounded shrink-0"><Users size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-agency-sub text-[10px] uppercase font-bold truncate">Clientes Ativos</p>
                <h2 className="text-xl font-bold truncate text-white">{activeClientsCount}</h2>
              </div>
           </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-4 rounded-lg flex items-center justify-center gap-2 hover:shadow-glow transition-all font-bold active:scale-95 relative z-10 text-sm tracking-wide uppercase"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* SECTION 2: FILTERS (TABS) */}
      <div className="md:hidden w-full mb-6">
        <div className="flex flex-wrap gap-2 w-full">
          {columns.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveMobileTab(col.id)}
              className={`flex-1 min-w-[45%] px-3 py-2.5 rounded text-xs font-bold transition-all border text-center uppercase tracking-wider ${
                activeMobileTab === col.id 
                  ? `bg-agency-900 border-primary-500 text-white shadow-lg` 
                  : 'bg-transparent text-agency-sub border-agency-800'
              }`}
            >
              {col.label} <span className="opacity-50 ml-1">({leads.filter(l => l.status === col.id).length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: CONTENT AREA */}
      <div className="flex-1 min-h-0 w-full">
        {/* Desktop View */}
        <div className="hidden md:flex gap-4 h-full pb-4 overflow-x-auto">
          {columns.map(col => (
             <Column 
               key={col.id} 
               col={col} 
               leads={leads} 
               moveLead={moveLead} 
               deleteLead={deleteLead} 
               openNoteModal={openNoteModal}
               togglePayment={togglePayment}
             />
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden h-full w-full">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeMobileTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-3 pb-20 w-full"
             >
               {leads.filter(l => l.status === activeMobileTab).length === 0 ? (
                 <div className="text-center py-12 text-agency-sub flex flex-col items-center">
                    <LayoutList size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">Vazio.</p>
                 </div>
               ) : (
                 leads.filter(l => l.status === activeMobileTab).map(lead => (
                   <LeadCard 
                     key={lead.id} 
                     lead={lead} 
                     moveLead={moveLead} 
                     deleteLead={deleteLead} 
                     openNoteModal={openNoteModal}
                     togglePayment={togglePayment}
                   />
                 ))
               )}
             </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-agency-900 border border-agency-800 rounded-xl w-[95%] max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6 border-b border-agency-800 pb-4">
                 <h3 className="text-lg font-bold text-white uppercase tracking-wide">Novo Cliente</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-agency-sub hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <InputGroup icon={User} label="Nome" value={newLead.name} onChange={v => setNewLead({...newLead, name: v})} placeholder="Ex: Roberto Almeida" />
                <InputGroup icon={Building2} label="Empresa/Serviço" value={newLead.company} onChange={v => setNewLead({...newLead, company: v})} placeholder="Ex: Consultoria" />
                <InputGroup 
                  icon={DollarSign} 
                  label="Valor Mensal" 
                  value={newLead.value} 
                  onChange={v => {
                    const val = parseFloat(v);
                    if (v === '') {
                        setNewLead({...newLead, value: undefined});
                    } else if (!isNaN(val) && val >= 0) {
                        setNewLead({...newLead, value: val});
                    }
                  }} 
                  placeholder="0.00" 
                  type="number" 
                />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-agency-800">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-agency-sub hover:text-white text-sm transition-colors">Cancelar</button>
                <button onClick={handleAddLead} className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded font-bold hover:shadow-glow text-sm uppercase tracking-wide">Salvar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Modal */}
      <AnimatePresence>
        {editingNoteLead && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-agency-900 border border-agency-800 rounded-xl w-full max-w-2xl p-6 md:p-8 shadow-2xl flex flex-col h-[85vh] md:h-[650px]"
            >
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                   <h3 className="text-xl font-bold text-white">Notas: {editingNoteLead.name}</h3>
                </div>
                <button onClick={() => setEditingNoteLead(null)} className="text-agency-sub hover:text-white"><X size={24} /></button>
              </div>
              
              <textarea 
                className="flex-1 w-full p-6 bg-black border border-agency-800 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all resize-none text-white text-base leading-relaxed font-mono"
                placeholder="Detalhes do projeto..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                autoFocus
              />
              
              <div className="flex justify-end mt-4 pt-4 border-t border-agency-800">
                  <button onClick={saveNote} className="px-8 py-3 bg-white text-black rounded font-bold hover:bg-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
                    <FileText size={16} /> Salvar
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Components
const InputGroup = ({ icon: Icon, label, value, onChange, placeholder, type = "text" }: any) => (
  <div className="space-y-1.5">
     <label className="text-[10px] font-bold text-agency-sub uppercase tracking-widest ml-1">{label}</label>
     <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-agency-sub group-focus-within:text-white transition-colors">
          <Icon size={16} />
        </div>
        <input 
          type={type}
          className="w-full pl-10 pr-4 py-3 bg-black border border-agency-800 rounded outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm font-medium text-white placeholder:text-agency-800"
          placeholder={placeholder}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
     </div>
  </div>
);

const Column = ({ col, leads, moveLead, deleteLead, openNoteModal, togglePayment }: any) => (
  <div className={`min-w-[85vw] md:min-w-[320px] flex-1 flex flex-col rounded-xl p-4 border border-agency-800 bg-agency-900/50`}>
    <div className={`flex items-center gap-2 mb-4 px-1 border-b pb-2 ${col.borderColor}`}>
      <span className={`font-bold text-sm uppercase tracking-wider ${col.color}`}>{col.label}</span>
      <span className="ml-auto text-xs font-bold text-white bg-agency-800 px-2 py-0.5 rounded">
        {leads.filter((l: Lead) => l.status === col.id).length}
      </span>
    </div>
    <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
      {leads.filter((l: Lead) => l.status === col.id).map((lead: Lead) => (
        <LeadCard 
          key={lead.id} 
          lead={lead} 
          moveLead={moveLead} 
          deleteLead={deleteLead} 
          openNoteModal={openNoteModal} 
          togglePayment={togglePayment}
        />
      ))}
    </div>
  </div>
);

const LeadCard = ({ lead, moveLead, deleteLead, openNoteModal, togglePayment }: any) => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
    const paymentStatus = lead.payments?.[currentMonthKey] || 'Pending';
    const isPaid = paymentStatus === 'Paid';

    return (
      <motion.div 
        layoutId={lead.id}
        className="bg-black p-4 rounded border border-agency-800 hover:border-primary-500 transition-colors group relative w-full shadow-lg"
      >
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="font-bold text-white text-base truncate flex-1 min-w-0">{lead.name}</span>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); openNoteModal(lead); }} className="text-agency-sub hover:text-white"><FileText size={14} /></button>
            <button onClick={() => deleteLead(lead.id)} className="text-agency-sub hover:text-red-500"><Trash2 size={14} /></button>
          </div>
        </div>
        <div className="text-xs text-agency-sub mb-4 flex items-center gap-1">
          <Building2 size={10} /> {lead.company}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-agency-800 gap-3">
          <span className="font-mono font-bold text-success-500 text-sm">
            {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </span>
          
          <div className="flex gap-2 flex-wrap justify-end sm:justify-end">
             {lead.status !== 'Ativo' && <ActionButton onClick={() => moveLead(lead.id, 'Ativo')} text="Fechar" primary />}
             {lead.status === 'Ativo' && <ActionButton onClick={() => moveLead(lead.id, 'Arquivado')} text="Arquivar" />}
             {lead.status === 'Potencial' && <ActionButton onClick={() => moveLead(lead.id, 'Negociacao')} text="Negociar" />}
             {lead.status === 'Negociacao' && <ActionButton onClick={() => moveLead(lead.id, 'Potencial')} text="Voltar" />}
          </div>
        </div>

        {/* Payment Toggle Section - Only for Active Clients */}
        {lead.status === 'Ativo' && (
            <div className="mt-3 pt-3 border-t border-agency-800 flex items-center justify-between">
                <span className="text-[10px] text-agency-sub uppercase font-bold tracking-wider capitalize">Mês {monthName}:</span>
                <button 
                    onClick={() => togglePayment(lead.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all duration-300 text-[10px] font-bold uppercase tracking-wider ${
                        isPaid 
                        ? 'bg-success-500/10 border-success-500 text-success-500 hover:bg-success-500/20' 
                        : 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20 animate-pulse'
                    }`}
                >
                    {isPaid ? <Check size={12} /> : null}
                    {isPaid ? 'Pago' : 'Pendente'}
                </button>
            </div>
        )}
      </motion.div>
    );
};

const ActionButton = ({ onClick, text, primary }: any) => (
  <button 
    onClick={onClick}
    className={`text-[10px] px-3 py-1.5 rounded font-bold uppercase tracking-wide transition-colors ${
      primary ? 'bg-primary-600 text-white hover:bg-primary-500 hover:shadow-glow' : 'bg-agency-800 text-agency-sub hover:text-white hover:bg-agency-700'
    }`}
  >
    {text}
  </button>
);

export default CRMView;