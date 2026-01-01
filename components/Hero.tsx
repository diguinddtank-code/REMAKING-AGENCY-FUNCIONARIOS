import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto w-full text-center relative z-10">
        
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block py-1.5 px-4 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6 shadow-sm">
            Vantage OS 2.0
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-luxury-900 mb-8 leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Organize sua vida. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">
            Escale seu império.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p 
          className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          O sistema operacional definitivo para quem não aceita o médio. 
          Gerencie leads, hábitos e projetos em uma interface desenhada para o topo.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col md:flex-row items-center justify-center gap-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <button className="group relative px-8 py-4 bg-luxury-900 text-white rounded-full font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-900/20 active:scale-95 w-full md:w-auto">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="flex items-center justify-center gap-2">
              Começar Gratuitamente
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <button className="px-8 py-4 bg-white text-luxury-900 border border-gray-200 rounded-full font-semibold text-lg hover:bg-gray-50 transition-colors w-full md:w-auto">
            Ver Demonstração
          </button>
        </motion.div>

        {/* The Dashboard Preview Component */}
        <DashboardPreview />
      </div>

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
      </div>
    </section>
  );
};

export default Hero;