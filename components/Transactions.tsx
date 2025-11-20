
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category, AccountType, TransactionStatus } from '../types';
import { 
  Plus, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, 
  Filter, HelpCircle, Calendar, ChevronDown, ChevronUp, 
  Trash2, Edit2, X, Search, Check, AlertCircle, RefreshCw, AlertTriangle,
  Camera, Mic, Sparkles, Loader2, StopCircle
} from 'lucide-react';
import { AIService } from '../services/ai';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onAdd: (t: Transaction) => void;
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Delete Modal State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [txToDelete, setTxToDelete] = useState<string | null>(null);
  
  // Expanded Item State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI States
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    account: 'all' as AccountType | 'all',
    status: 'all' as TransactionStatus | 'all',
    category: 'all'
  });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    accountOrigin: 'PF',
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    recurrence: 'none'
  });

  // Derived Data
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      
      // Date Filter
      const monthMatch = tDate.getMonth() === filters.month;
      const yearMatch = tDate.getFullYear() === filters.year;
      if (!monthMatch || !yearMatch) return false;

      // Account Filter
      if (filters.account !== 'all' && t.accountOrigin !== filters.account) return false;

      // Status Filter
      if (filters.status !== 'all' && t.status !== filters.status) return false;
      
      // Category Filter
      if (filters.category !== 'all' && t.category !== filters.category) return false;

      // Search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return t.title.toLowerCase().includes(searchLower) || 
               (t.description && t.description.toLowerCase().includes(searchLower));
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  const handleOpenModal = (tx?: Transaction) => {
    if (tx) {
      setEditingId(tx.id);
      setFormData({ ...tx });
    } else {
      setEditingId(null);
      setFormData({
        type: 'expense',
        accountOrigin: 'PF',
        status: 'completed',
        date: new Date().toISOString().split('T')[0],
        recurrence: 'none',
        title: '',
        amount: 0,
        description: ''
      });
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'expense',
      accountOrigin: 'PF',
      status: 'completed',
      date: new Date().toISOString().split('T')[0],
      recurrence: 'none',
      title: '',
      amount: 0,
      description: ''
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.title) return;

    const baseTx: Transaction = {
      id: editingId || crypto.randomUUID(),
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type as any,
      category: formData.category || 'misc',
      accountOrigin: formData.accountOrigin as any,
      date: formData.date || new Date().toISOString(),
      status: formData.status as any,
      recurrence: formData.recurrence as any,
      description: formData.description,
      // For transfers
      accountDestination: formData.type === 'transfer' ? formData.accountDestination : undefined
    };
    
    if (editingId) {
      onUpdate(baseTx);
    } else {
      onAdd(baseTx);
    }
    
    resetForm();
    setShowModal(false);
  };

  const initiateDelete = (id: string) => {
    setTxToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (txToDelete) {
      onDelete(txToDelete);
      setTxToDelete(null);
      setShowDeleteConfirm(false);
      setShowModal(false); // Close edit modal if open
    }
  };

  const getCategoryColor = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : '#9ca3af';
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Sem categoria';
  };

  // --- AI Features ---

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingReceipt(true);
    try {
      const data = await AIService.analyzeReceipt(file);
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        amount: data.amount || prev.amount,
        date: data.date || prev.date,
        description: data.description || prev.description,
      }));
      
      // Trigger quick categorization on the extracted title
      if (data.title) handleQuickCategorize(data.title);
      
    } catch (error) {
      alert("Não foi possível ler o recibo. Tente novamente.");
    } finally {
      setIsAnalyzingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleQuickCategorize = async (title: string) => {
    setIsSuggesting(true);
    try {
      const catNames = categories.map(c => c.name);
      const suggestedName = await AIService.suggestCategory(title, catNames);
      const foundCat = categories.find(c => c.name.toLowerCase() === suggestedName?.toLowerCase());
      if (foundCat) {
        setFormData(prev => ({ ...prev, category: foundCat.id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop Recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const text = await AIService.transcribeAudio(audioBlob);
          setFormData(prev => ({ 
            ...prev, 
            description: prev.description ? `${prev.description} ${text}` : text 
          }));
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing mic", err);
      }
    }
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Transações</h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2 text-zinc-400 hover:text-white border border-zinc-700 rounded-lg"
            >
              <Filter size={20} />
            </button>
        </div>

        {/* Desktop Filters */}
        <div className={`
          ${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-3 w-full md:w-auto bg-zinc-900/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-zinc-800 md:border-none
        `}>
           {/* Month/Year Picker */}
           <div className="flex gap-2">
              <select 
                value={filters.month} 
                onChange={e => setFilters({...filters, month: parseInt(e.target.value)})}
                className="bg-cardbg border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-metal-500 outline-none"
              >
                {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                value={filters.year} 
                onChange={e => setFilters({...filters, year: parseInt(e.target.value)})}
                className="bg-cardbg border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-metal-500 outline-none"
              >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>

           {/* Account Filter */}
           <select 
              value={filters.account} 
              onChange={e => setFilters({...filters, account: e.target.value as any})}
              className="bg-cardbg border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-metal-500 outline-none"
           >
              <option value="all">Todas Contas</option>
              <option value="PJ">PJ</option>
              <option value="PF">PF</option>
              <option value="Premiação">Premiação</option>
           </select>

           {/* Status Filter */}
           <select 
              value={filters.status} 
              onChange={e => setFilters({...filters, status: e.target.value as any})}
              className="bg-cardbg border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-metal-500 outline-none"
           >
              <option value="all">Todos Status</option>
              <option value="completed">Efetivado</option>
              <option value="pending">Pendente</option>
              <option value="provisioned">Provisionado</option>
           </select>

           {/* Category Filter */}
           <select 
              value={filters.category} 
              onChange={e => setFilters({...filters, category: e.target.value})}
              className="bg-cardbg border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-metal-500 outline-none max-w-[150px]"
           >
              <option value="all">Todas Categorias</option>
              {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
              ))}
           </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
          <Search className="absolute left-4 top-3.5 text-zinc-500" size={18} />
          <input 
              type="text" 
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              className="w-full bg-cardbg border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-metal-500 outline-none shadow-sm"
              placeholder="Buscar por título, descrição ou categoria..."
          />
      </div>

      {/* List */}
      <div className="space-y-3 pb-24">
        {filteredTransactions.length === 0 && (
            <div className="text-center text-zinc-500 py-12 flex flex-col items-center">
                <Search size={48} className="mb-4 text-zinc-700" />
                <p>Nenhuma transação encontrada com os filtros atuais.</p>
            </div>
        )}
        
        {filteredTransactions.map((tx) => {
          const isExpanded = expandedId === tx.id;
          const color = getCategoryColor(tx.category);
          
          return (
            <div 
                key={tx.id} 
                className={`bg-cardbg border ${isExpanded ? 'border-metal-500/50 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'border-zinc-800'} rounded-xl overflow-hidden transition-all duration-200`}
            >
                {/* Main Row (Clickable) */}
                <div 
                    onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
                >
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div 
                            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center`}
                            style={{ backgroundColor: `${color}20`, color: color }}
                        >
                            {tx.type === 'income' ? <ArrowUpRight size={20} /> : tx.type === 'expense' ? <ArrowDownLeft size={20} /> : <ArrowRightLeft size={20} />}
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-medium text-white truncate">{tx.title}</h4>
                            <div className="flex items-center text-xs text-zinc-500 mt-0.5 gap-2">
                                <span>{new Date(tx.date).toLocaleDateString()}</span>
                                <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                                <span>{getCategoryName(tx.category)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-6 shrink-0">
                        <div className="text-right">
                             <div className={`font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {tx.type === 'expense' ? '-' : '+'} R$ {tx.amount.toFixed(2)}
                            </div>
                            {tx.status === 'pending' && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">Pendente</span>
                            )}
                        </div>
                        <div className="text-zinc-500">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="bg-zinc-900/50 border-t border-zinc-800/50 p-4 text-sm text-zinc-400 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <div>
                                 <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Descrição</p>
                                 <p className="text-white">{tx.description || 'Sem descrição'}</p>
                             </div>
                             <div>
                                 <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Origem</p>
                                 <p className="text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                                    Conta {tx.accountOrigin}
                                 </p>
                             </div>
                             <div>
                                 <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Recorrência</p>
                                 <div className="flex items-center text-white">
                                     {tx.recurrence !== 'none' ? (
                                        <>
                                            <RefreshCw size={14} className="mr-1.5 text-metal-400" />
                                            <span className="capitalize">{tx.recurrence === 'monthly' ? 'Mensal' : tx.recurrence === 'weekly' ? 'Semanal' : 'Anual'}</span>
                                        </>
                                     ) : (
                                        'Não recorrente'
                                     )}
                                 </div>
                             </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-zinc-800/50">
                            <button 
                                onClick={() => initiateDelete(tx.id)}
                                className="flex items-center px-3 py-1.5 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-xs border border-transparent hover:border-red-900"
                            >
                                <Trash2 size={14} className="mr-1.5" /> Excluir
                            </button>
                            <button 
                                onClick={() => handleOpenModal(tx)}
                                className="flex items-center px-3 py-1.5 text-metal-400 hover:bg-metal-900/30 rounded-lg transition-colors text-xs border border-transparent hover:border-metal-800"
                            >
                                <Edit2 size={14} className="mr-1.5" /> Editar
                            </button>
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-metal-600 hover:bg-metal-500 text-white rounded-full shadow-lg shadow-metal-900/50 flex items-center justify-center transition-transform hover:scale-110 z-30"
      >
        <Plus size={28} />
      </button>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-red-900/30 w-full max-w-sm rounded-xl shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Excluir Transação?</h3>
                <p className="text-zinc-400 text-sm mb-6">
                    Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-red-900/20"
                    >
                        Confirmar Exclusão
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative max-h-[90vh] overflow-y-auto">
            
             {/* Help Button in Modal */}
             <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
                 <button 
                    onMouseEnter={() => setShowHelp(true)}
                    onMouseLeave={() => setShowHelp(false)}
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-zinc-500 hover:text-metal-400 transition-colors"
                 >
                    <HelpCircle size={20} />
                 </button>
                 
                 {/* AI Receipt Scan Button */}
                 {!editingId && (
                   <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleReceiptUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzingReceipt}
                        className="flex items-center gap-1 text-xs bg-metal-500/10 text-metal-400 px-2 py-1 rounded-lg border border-metal-500/30 hover:bg-metal-500/20 transition-colors"
                      >
                        {isAnalyzingReceipt ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Camera size={14} />
                        )}
                        Escanear Recibo
                      </button>
                   </div>
                 )}
                 
                 {showHelp && (
                    <div className="absolute top-8 left-0 w-64 bg-zinc-800 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs text-zinc-300 z-50">
                        Preencha manualmente ou use o botão de Câmera para escanear um comprovante com a IA.
                    </div>
                 )}
             </div>

            <div className="p-6 border-b border-zinc-800 flex justify-between items-center pl-32">
              <h3 className="text-xl font-bold text-white truncate">{editingId ? 'Editar' : 'Novo Lançamento'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Enhanced Type Selector */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: 'income', label: 'Entrada', icon: ArrowUpRight, color: 'emerald' },
                        { id: 'expense', label: 'Saída', icon: ArrowDownLeft, color: 'red' },
                        { id: 'transfer', label: 'Transf.', icon: ArrowRightLeft, color: 'metal' }
                    ].map(t => {
                        const isActive = formData.type === t.id;
                        const Icon = t.icon;
                        let activeClass = isActive 
                          ? (t.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 
                             t.color === 'red' ? 'bg-red-500/10 border-red-500 text-red-500' : 
                             'bg-metal-500/10 border-metal-500 text-metal-500')
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300';

                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setFormData({...formData, type: t.id as any})}
                                className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all duration-200 ${activeClass}`}
                            >
                                <div className={`p-1.5 rounded-full mb-1 ${isActive ? 'bg-current/10' : 'bg-transparent'}`}>
                                    <Icon size={20} />
                                </div>
                                <span className="text-xs font-bold">{t.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Data</label>
                        <input 
                            type="date"
                            required
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Valor (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            required
                            value={formData.amount || ''}
                            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                            placeholder="0,00"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-400">Título</label>
                      {isSuggesting && <span className="text-[10px] text-metal-400 flex items-center"><Sparkles size={10} className="mr-1"/> IA sugerindo categoria...</span>}
                    </div>
                    <input 
                        type="text" 
                        required
                        value={formData.title || ''}
                        onChange={e => {
                           setFormData({...formData, title: e.target.value});
                           // Debounce suggestion
                        }}
                        onBlur={() => {
                          if(formData.title && !formData.category) handleQuickCategorize(formData.title);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        placeholder="Ex: Aluguel"
                    />
                </div>
                
                <div className="space-y-1 relative">
                    <div className="flex justify-between">
                      <label className="text-xs text-zinc-400">Descrição (Opcional)</label>
                      <button 
                        type="button"
                        onClick={toggleRecording}
                        className={`text-[10px] flex items-center px-2 py-0.5 rounded transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-zinc-500 hover:text-white bg-zinc-800'}`}
                      >
                         {isRecording ? <StopCircle size={12} className="mr-1"/> : <Mic size={12} className="mr-1"/>}
                         {isRecording ? 'Parar Gravação' : 'Ditar Descrição'}
                      </button>
                    </div>
                    <textarea 
                        rows={2}
                        value={formData.description || ''}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none resize-none"
                        placeholder="Detalhes adicionais..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">Categoria</label>
                        <select 
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        >
                            <option value="misc">Selecione...</option>
                            {categories.filter(c => {
                                if (formData.type === 'transfer') return c.id === 'cat_transfer';
                                return c.type === formData.type;
                            }).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-zinc-400">
                             {formData.type === 'transfer' ? 'Origem' : 'Conta'}
                        </label>
                        <select 
                            value={formData.accountOrigin}
                            onChange={e => setFormData({...formData, accountOrigin: e.target.value as any})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        >
                            <option value="PJ">PJ</option>
                            <option value="PF">PF</option>
                            <option value="Premiação">Premiação</option>
                        </select>
                    </div>
                </div>

                {/* Transfer Destination */}
                {formData.type === 'transfer' && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-xs text-zinc-400">Destino</label>
                        <select 
                            value={formData.accountDestination}
                            onChange={e => setFormData({...formData, accountDestination: e.target.value as any})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        >
                            <option value="">Selecione...</option>
                            <option value="PJ">PJ</option>
                            <option value="PF">PF</option>
                            <option value="Premiação">Premiação</option>
                        </select>
                    </div>
                )}

                {/* Recurrence & Status */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                    <div className="space-y-1">
                         <label className="text-xs text-zinc-400">Status</label>
                         <select 
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as any})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        >
                            <option value="completed">Efetivado</option>
                            <option value="pending">Pendente</option>
                            <option value="provisioned">Provisionado</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                         <label className="text-xs text-zinc-400 flex items-center gap-1">
                            <RefreshCw size={10} /> Recorrência
                         </label>
                         <select 
                            value={formData.recurrence}
                            onChange={e => setFormData({...formData, recurrence: e.target.value as any})}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-white focus:border-metal-500 outline-none"
                        >
                            <option value="none">Não repetir</option>
                            <option value="weekly">Semanal</option>
                            <option value="monthly">Mensal</option>
                            <option value="annual">Anual</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={() => initiateDelete(editingId)}
                            className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/30 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button type="submit" className="flex-1 bg-metal-600 hover:bg-metal-500 text-white py-3 rounded-lg font-medium shadow-lg shadow-metal-900/20 transition-all">
                        {editingId ? 'Salvar Alterações' : 'Criar Transação'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
