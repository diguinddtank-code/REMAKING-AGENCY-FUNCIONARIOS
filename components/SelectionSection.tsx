import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Medal, Sparkles, ArrowRight } from 'lucide-react';
import { FeatureCardProps } from '../types';

const cards: FeatureCardProps[] = [
  {
    id: 'lifestyle',
    title: 'Organizar minha Vida',
    subtitle: 'Domine sua rotina, saúde e bem-estar em um único lugar.',
    icon: Sparkles,
    ctaText: 'Criar Rotina Ideal',
    gradient: 'from-rose-50 to-orange-50'
  },
  {
    id: 'business',
    title: 'Escalar meu Negócio',
    subtitle: 'CRM, gestão de equipe e financeiro para visionários.',
    icon: Briefcase,
    ctaText: 'Acessar Dashboard',
    gradient: 'from-slate-50 to-gray-100'
  },
  {
    id: 'performance',
    title: 'Sou Atleta / Aluno',
    subtitle: 'Rastreie progresso, notas e metas de alta performance.',
    icon: Medal,
    ctaText: 'Iniciar Jornada',
    gradient: 'from-blue-50 to-indigo-50'
  }
];

const SelectionSection: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-luxury-900 mb-4">O que te trouxe aqui?</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Escolha seu foco principal. O Vantage se adapta ao seu momento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const isHovered = hoveredId === card.id;

            return (
              <motion.div
                key={card.id}
                className={`relative overflow-hidden rounded-3xl p-8 cursor-pointer border border-transparent transition-colors duration-500 bg-white shadow-sm hover:shadow-xl`}
                onHoverStart={() => setHoveredId(card.id)}
                onHoverEnd={() => setHoveredId(null)}
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />
                
                <div className="relative z-10 h-full flex flex-col items-start">
                  <div className={`p-4 rounded-2xl bg-white shadow-sm mb-6 text-luxury-900 transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                    <card.icon size={28} strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-luxury-900 mb-3">{card.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-8">{card.subtitle}</p>
                  
                  <div className="mt-auto">
                    <motion.button
                      className="flex items-center gap-2 text-sm font-semibold text-luxury-900 group"
                      initial={false}
                      animate={{ 
                        x: isHovered ? 5 : 0,
                        opacity: isHovered ? 1 : 0.7 
                      }}
                    >
                      <span className="relative">
                        {card.ctaText}
                        <span className={`absolute left-0 -bottom-1 w-full h-px bg-luxury-900 transform origin-left transition-transform duration-300 ${isHovered ? 'scale-x-100' : 'scale-x-0'}`} />
                      </span>
                      <ArrowRight size={16} className={`transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                    </motion.button>
                  </div>
                </div>

                {/* Decorative circle */}
                <motion.div 
                  className="absolute -bottom-10 -right-10 w-32 h-32 bg-white rounded-full opacity-50 blur-2xl pointer-events-none"
                  animate={{ 
                    scale: isHovered ? 1.5 : 1,
                  }}
                  transition={{ duration: 0.6 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SelectionSection;