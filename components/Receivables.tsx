
import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Save, Settings, X, Percent, DollarSign, HelpCircle } from 'lucide-react';

interface ReceivablesProps {
  onSaveForDistribution: (amount: number, sourceName: string) => void;
}

interface RecurringExpenseConfig {
  id: string;
  name: string;
  value: number;
  type: 'fixed' | 'percentage';
  isActive: boolean;
}

const Receivables: React.FC<ReceivablesProps> = ({ onSaveForDistribution }) => {
  // Form State
  const [title, setTitle] = useState('');
  const [grossAmount, setGrossAmount] = useState<string>('');
  
  // Manual Expenses State
  const [manualExpenses, setManualExpenses] = useState<{id: string, desc: string, amount: number}[]>([]);
  
  // Recurring Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [recurringConfigs, setRecurringConfigs] = useState<RecurringExpenseConfig[]>([]);
  
  // Temp Inputs
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  
  // Temp Config Inputs
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const [newConfigType, setNewConfigType] = useState<'fixed' | 'percentage'>('percentage');

  // Load presets on mount
  useEffect(() => {
    const saved = localStorage.getItem('mgf_recurring_presets');
    if (saved) {
      try {
        setRecurringConfigs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recurring presets", e);
      }
    }
  }, []);

  // Save presets when changed
  useEffect(() => {
    localStorage.setItem('mgf_recurring_presets', JSON.stringify(recurringConfigs));
  }, [recurringConfigs]);

  // --- Manual Expense Logic ---
  const addManualExpense = () => {
    if (!newExpDesc || !newExpAmount) return;
    setManualExpenses([...manualExpenses, {
        id: crypto.randomUUID(),
        desc: newExpDesc,
        amount: parseFloat(newExpAmount)
    }]);
    setNewExpDesc('');
    setNewExpAmount('');
  };

  const removeManualExpense = (id: string) => {
    setManualExpenses(manualExpenses.filter(e => e.id !== id));
  };

  // --- Recurring Config Logic ---
  const addRecurringConfig = () => {
    if (!newConfigName || !newConfigValue) return;
    const newConfig: RecurringExpenseConfig = {
      id: crypto.randomUUID(),
      name: newConfigName,
      value: parseFloat(newConfigValue),
      type: newConfigType,
      isActive: true
    };
    setRecurringConfigs([...recurringConfigs, newConfig]);
    setNewConfigName('');
    setNewConfigValue('');
  };

  const removeRecurringConfig = (id: string) => {
    setRecurringConfigs(recurringConfigs.filter(c => c.id !== id));
  };

  const toggleRecurringConfig = (id: string) => {
    setRecurringConfigs(recurringConfigs.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  // --- Calculations ---
  const calculatedAutoExpenses = useMemo(() => {
    const gross = parseFloat(grossAmount) || 0;
    return recurringConfigs
      .filter(c => c.isActive)
      .map(c => ({
        id: c.id,
        desc: `${c.name} (${c.type === 'percentage' ? `${c.value}%` : 'Fixo'})`,
        amount: c.type === 'percentage' ? (gross * c.value / 100) : c.value,
        isAuto: true
      }));
  }, [grossAmount, recurringConfigs]);

  const totalManualExpenses = manualExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAutoExpenses = calculatedAutoExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalManualExpenses + totalAutoExpenses;
  const netAmount = (parseFloat(grossAmount) || 0) - totalExpenses;

  const handleProcess = () => {
    if (netAmount <= 0 || !title) {
        alert("Valor líquido inválido ou falta título");
        return;
    }
    onSaveForDistribution(netAmount, title);
    // Reset Form only (keep presets)
    setTitle('');
    setGrossAmount('');
    setManualExpenses([]);
  };

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Gestão de Receitas</h2>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg border transition-all ${showSettings ? 'bg-metal-600 border-metal-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}
          title="Configurar Despesas Recorrentes"
        >
          <Settings size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className={`bg-cardbg border border-zinc-800 rounded-xl p-6 shadow-lg transition-all ${showSettings ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Título da Entrada</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-metal-500 focus:ring-1 focus:ring-metal-500 outline-none transition-all"
                        placeholder="Ex: Nota Fiscal #1020 - Cliente ABC"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Valor Bruto (R$)</label>
                    <input 
                        type="number" 
                        value={grossAmount}
                        onChange={e => setGrossAmount(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white text-lg font-semibold focus:border-metal-500 focus:ring-1 focus:ring-metal-500 outline-none transition-all"
                        placeholder="0,00"
                    />
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Deduções</h3>
                    
                    {/* Auto Expenses List */}
                    {calculatedAutoExpenses.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-xs text-metal-400 uppercase font-bold tracking-wider mb-2">Automáticas / Recorrentes</p>
                        {calculatedAutoExpenses.map(exp => (
                            <div key={exp.id} className="flex justify-between items-center bg-metal-900/20 p-2 rounded border border-metal-900/40 border-l-2 border-l-metal-500">
                                <span className="text-metal-100 text-sm">{exp.desc}</span>
                                <span className="text-red-400 text-sm font-medium">- R$ {exp.amount.toFixed(2)}</span>
                            </div>
                        ))}
                      </div>
                    )}

                    {/* Manual Expenses List */}
                    <div className="space-y-2 mb-3">
                        {manualExpenses.length > 0 && <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Manuais</p>}
                        {manualExpenses.map(exp => (
                            <div key={exp.id} className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800">
                                <span className="text-zinc-400 text-sm">{exp.desc}</span>
                                <div className="flex items-center">
                                    <span className="text-red-400 text-sm font-medium mr-3">- R$ {exp.amount.toFixed(2)}</span>
                                    <button onClick={() => removeManualExpense(exp.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Manual Expense */}
                    <div className="flex gap-2 mt-4">
                        <input 
                            type="text" 
                            placeholder="Outra despesa (ex: Frete)" 
                            value={newExpDesc}
                            onChange={e => setNewExpDesc(e.target.value)}
                            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-zinc-500 outline-none"
                        />
                        <input 
                            type="number" 
                            placeholder="Valor" 
                            value={newExpAmount}
                            onChange={e => setNewExpAmount(e.target.value)}
                            className="w-24 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-zinc-500 outline-none"
                        />
                        <button onClick={addManualExpense} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded border border-zinc-700 transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-zinc-800">
                    <div className="flex justify-between items-end mb-4">
                        <div className="text-sm text-zinc-500">Total de Deduções:</div>
                        <div className="text-red-400 font-medium">- R$ {totalExpenses.toFixed(2)}</div>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-zinc-500">Valor Líquido para Distribuição</p>
                                <p className={`text-3xl font-bold ${netAmount > 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                    R$ {netAmount > 0 ? netAmount.toFixed(2) : '0.00'}
                                </p>
                            </div>
                            <button 
                                onClick={handleProcess}
                                disabled={netAmount <= 0}
                                className="bg-metal-600 hover:bg-metal-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium shadow-lg shadow-metal-900/20 flex items-center transition-all"
                            >
                                <Save size={18} className="mr-2" />
                                Processar
                            </button>
                        </div>
                        {netAmount <= 0 && (grossAmount && parseFloat(grossAmount) > 0) && (
                            <div className="text-center bg-red-500/10 border border-red-900/30 rounded p-2">
                                <p className="text-xs text-red-400 font-medium">
                                    O valor líquido deve ser maior que zero para processar.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl h-fit animate-in fade-in slide-in-from-right duration-300 relative">
                
                {/* Help Button in Panel */}
                <div className="absolute top-4 left-4 z-50">
                     <button 
                        onMouseEnter={() => setShowHelp(true)}
                        onMouseLeave={() => setShowHelp(false)}
                        onClick={() => setShowHelp(!showHelp)}
                        className="text-zinc-500 hover:text-metal-400 transition-colors"
                     >
                        <HelpCircle size={16} />
                     </button>
                     {showHelp && (
                        <div className="absolute top-8 left-0 w-64 bg-zinc-800 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs text-zinc-300 z-50">
                            Cadastre taxas (em % ou valor fixo) que sempre incidem sobre seus recebimentos (ex: Imposto, Taxa Bancária). Elas serão aplicadas automaticamente.
                        </div>
                     )}
                </div>

                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2 pl-8">
                    <h3 className="font-medium text-white flex items-center">
                        <Settings size={16} className="mr-2 text-metal-400" />
                        Despesas Recorrentes
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                
                <p className="text-xs text-zinc-500 mb-4">
                    Itens adicionados aqui serão deduzidos automaticamente do valor bruto.
                </p>

                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
                    {recurringConfigs.length === 0 && (
                        <p className="text-xs text-zinc-600 text-center py-4 italic">Nenhuma configuração salva.</p>
                    )}
                    {recurringConfigs.map(config => (
                        <div key={config.id} className={`p-2 rounded border flex justify-between items-center ${config.isActive ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800 opacity-60'}`}>
                            <div className="flex items-center cursor-pointer flex-1" onClick={() => toggleRecurringConfig(config.id)}>
                                <div className={`w-3 h-3 rounded-full mr-2 ${config.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-700'}`} />
                                <div>
                                    <div className="text-sm text-zinc-200 font-medium">{config.name}</div>
                                    <div className="text-xs text-zinc-500">
                                        {config.type === 'percentage' ? `${config.value}%` : `R$ ${config.value.toFixed(2)}`}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => removeRecurringConfig(config.id)} className="text-zinc-600 hover:text-red-500 p-1">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="border-t border-zinc-800 pt-3">
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Nome (ex: Imposto)" 
                            value={newConfigName}
                            onChange={e => setNewConfigName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-metal-500 outline-none"
                        />
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="number" 
                                    placeholder="Valor" 
                                    value={newConfigValue}
                                    onChange={e => setNewConfigValue(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-metal-500 outline-none"
                                />
                            </div>
                            <div className="flex bg-zinc-950 border border-zinc-700 rounded overflow-hidden shrink-0">
                                <button 
                                    onClick={() => setNewConfigType('percentage')}
                                    className={`px-2 py-1 flex items-center justify-center transition-colors ${newConfigType === 'percentage' ? 'bg-metal-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Porcentagem"
                                >
                                    <Percent size={14} />
                                </button>
                                <button 
                                    onClick={() => setNewConfigType('fixed')}
                                    className={`px-2 py-1 flex items-center justify-center transition-colors ${newConfigType === 'fixed' ? 'bg-metal-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    title="Valor Fixo"
                                >
                                    <DollarSign size={14} />
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={addRecurringConfig}
                            disabled={!newConfigName || !newConfigValue}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 py-1.5 rounded text-xs border border-zinc-700 transition-colors flex items-center justify-center"
                        >
                            <Plus size={14} className="mr-1" /> Adicionar Regra
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Receivables;
