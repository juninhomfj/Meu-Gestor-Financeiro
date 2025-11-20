import React, { useState, useEffect } from 'react';
import { PieChart, Sliders, AlertTriangle } from 'lucide-react';

interface DistributionProps {
  initialAmount: number; // Passed from Receivables or 0
  sourceName?: string;
  onConfirm: (distribution: { pj: number, pf: number, bonus: number }) => void;
}

const Distribution: React.FC<DistributionProps> = ({ initialAmount, sourceName, onConfirm }) => {
  const [amountToDistribute, setAmountToDistribute] = useState(initialAmount);
  
  // Percentages
  const [split, setSplit] = useState({ pj: 30, pf: 60, bonus: 10 });
  
  // Calculated values
  const valPJ = (amountToDistribute * split.pj) / 100;
  const valPF = (amountToDistribute * split.pf) / 100;
  const valBonus = (amountToDistribute * split.bonus) / 100;

  const totalPct = split.pj + split.pf + split.bonus;
  // Use a small epsilon for float comparison
  const isValid = Math.abs(totalPct - 100) < 0.1;

  useEffect(() => {
      if (initialAmount > 0) setAmountToDistribute(initialAmount);
  }, [initialAmount]);

  const handleSliderChange = (key: 'pj' | 'pf' | 'bonus', val: string) => {
    setSplit(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const applySuggestion = () => {
      setSplit({ pj: 30, pf: 60, bonus: 10 });
  };

  const handleDistribute = () => {
      if (!isValid) return;
      onConfirm({ pj: valPJ, pf: valPF, bonus: valBonus });
      setAmountToDistribute(0); // Reset
  };

  const getSliderColorClass = (originalColor: string) => {
    return isValid ? originalColor : 'accent-red-500';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <PieChart className="mr-2 text-metal-400" /> Distribuição
      </h2>

      <div className="bg-cardbg border border-zinc-800 rounded-xl p-8 shadow-xl">
        
        {/* Input Section */}
        <div className="mb-8 text-center">
            <label className="text-zinc-400 text-sm block mb-2">Valor Disponível para Distribuição</label>
            <input 
                type="number" 
                value={amountToDistribute || ''} 
                onChange={e => setAmountToDistribute(parseFloat(e.target.value))}
                className="bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-3xl font-bold text-center text-white w-full max-w-xs focus:border-metal-500 outline-none"
                placeholder="R$ 0,00"
            />
            {sourceName && <p className="text-sm text-metal-400 mt-2">Origem: {sourceName}</p>}
        </div>

        {/* Sliders */}
        <div className="space-y-6 mb-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-zinc-300">Regra de Distribuição</h3>
                <button onClick={applySuggestion} className="text-xs text-metal-400 hover:underline flex items-center">
                    <Sliders size={12} className="mr-1" /> Sugerir 30/60/10
                </button>
            </div>

            {/* PJ */}
            <div className={`bg-zinc-900/50 p-4 rounded-lg border transition-colors ${isValid ? 'border-zinc-800' : 'border-red-900/30 bg-red-900/5'}`}>
                <div className="flex justify-between mb-2">
                    <span className={`${isValid ? 'text-indigo-400' : 'text-red-400'} font-medium`}>PJ ({split.pj}%)</span>
                    <span className="text-white font-bold">R$ {valPJ.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="100" value={split.pj} 
                    onChange={e => handleSliderChange('pj', e.target.value)}
                    className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer ${getSliderColorClass('accent-indigo-500')}`}
                />
            </div>

            {/* PF */}
            <div className={`bg-zinc-900/50 p-4 rounded-lg border transition-colors ${isValid ? 'border-zinc-800' : 'border-red-900/30 bg-red-900/5'}`}>
                <div className="flex justify-between mb-2">
                    <span className={`${isValid ? 'text-emerald-400' : 'text-red-400'} font-medium`}>PF ({split.pf}%)</span>
                    <span className="text-white font-bold">R$ {valPF.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="100" value={split.pf} 
                    onChange={e => handleSliderChange('pf', e.target.value)}
                    className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer ${getSliderColorClass('accent-emerald-500')}`}
                />
            </div>

             {/* Bonus */}
             <div className={`bg-zinc-900/50 p-4 rounded-lg border transition-colors ${isValid ? 'border-zinc-800' : 'border-red-900/30 bg-red-900/5'}`}>
                <div className="flex justify-between mb-2">
                    <span className={`${isValid ? 'text-amber-400' : 'text-red-400'} font-medium`}>Premiação ({split.bonus}%)</span>
                    <span className="text-white font-bold">R$ {valBonus.toFixed(2)}</span>
                </div>
                <input 
                    type="range" min="0" max="100" value={split.bonus} 
                    onChange={e => handleSliderChange('bonus', e.target.value)}
                    className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer ${getSliderColorClass('accent-amber-500')}`}
                />
            </div>
        </div>

        {/* Validation Messages */}
        <div className="mb-6 h-6 text-center">
            {!isValid && (
                <div className="inline-flex items-center text-red-400 text-sm font-medium animate-pulse bg-red-500/10 px-3 py-1 rounded-full">
                    <AlertTriangle size={14} className="mr-2" />
                    A soma das porcentagens é {totalPct.toFixed(1)}%. Deve ser exatamente 100%.
                </div>
            )}
        </div>

        {/* Action */}
        <div className="border-t border-zinc-800 pt-6">
            <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-400">Total Distribuído:</span>
                <span className={`font-bold ${isValid ? 'text-green-500' : 'text-red-500'}`}>
                    {totalPct.toFixed(1)}%
                </span>
            </div>
            
            <button 
                onClick={handleDistribute}
                disabled={!isValid || amountToDistribute <= 0}
                className="w-full bg-metal-600 hover:bg-metal-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-metal-900/20 transition-all"
            >
                Confirmar Lançamentos
            </button>
        </div>

      </div>
    </div>
  );
};

export default Distribution;