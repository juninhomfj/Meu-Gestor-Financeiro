import React, { useState } from 'react';
import { X, ArrowRight, Check, Landmark, PieChart, Mic, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Bem-vindo ao Meu Gestor",
      desc: "Sua central de inteligência financeira completa. Otimizado para gestão de contas PF, PJ e Investimentos.",
      icon: <Landmark size={64} className="text-metal-400" />,
      color: "from-metal-600 to-metal-800"
    },
    {
      title: "Fluxo de Receita Inteligente",
      desc: "Comece pela 'Gestão de Receitas'. Lance o valor bruto, configure descontos automáticos e calcule o líquido real antes de gastar.",
      icon: <ShieldCheck size={64} className="text-emerald-400" />,
      color: "from-emerald-600 to-emerald-800"
    },
    {
      title: "Regra de Distribuição",
      desc: "Use a ferramenta de Distribuição para separar seu dinheiro: 30% PJ, 60% PF e 10% Premiação/Reserva. Organização é a chave.",
      icon: <PieChart size={64} className="text-indigo-400" />,
      color: "from-indigo-600 to-indigo-800"
    },
    {
      title: "Inteligência Artificial",
      desc: "Configure sua chave gratuita do Gemini nas configurações para habilitar comandos de voz em tempo real e leitura de recibos.",
      icon: <Mic size={64} className="text-amber-400" />,
      color: "from-amber-600 to-amber-800"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const currentStepData = steps[step];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Background Gradient */}
        <div className={`absolute top-0 left-0 w-full h-48 bg-gradient-to-b ${currentStepData.color} opacity-20`} />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 pt-12 flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            {currentStepData.icon}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            {currentStepData.title}
          </h2>
          
          <p className="text-zinc-400 leading-relaxed mb-8 min-h-[80px]">
            {currentStepData.desc}
          </p>

          {/* Indicators */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-zinc-700'}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center"
          >
            {step === steps.length - 1 ? (
              <>Começar Agora <Check size={20} className="ml-2" /></>
            ) : (
              <>Próximo <ArrowRight size={20} className="ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;