
import React, { useState, useEffect } from 'react';
import { Category, AccountType, UserSettings } from '../types';
import { StorageService } from '../services/storage';
import { 
  Trash2, Edit2, Plus, Save, X, HelpCircle, 
  Home, Car, ShoppingCart, Heart, Zap, Smartphone, 
  Wifi, Coffee, Gift, Briefcase, GraduationCap, 
  TrendingUp, TrendingDown, DollarSign, Shield, 
  MoreHorizontal, Check, Calendar, MessageCircle,
  Cpu, Key, AlertTriangle
} from 'lucide-react';

interface SettingsProps {
  categories: Category[];
  onSaveCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

// Map of available icons for the picker
const ICON_MAP: Record<string, React.ElementType> = {
  Home, Car, ShoppingCart, Heart, Zap, Smartphone, 
  Wifi, Coffee, Gift, Briefcase, GraduationCap, 
  TrendingUp, TrendingDown, DollarSign, Shield, 
  MoreHorizontal
};

// Utility to safely get icon
const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName] || MoreHorizontal;
};

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', 
  '#ec4899', '#f43f5e', '#64748b', '#71717a'
];

const Settings: React.FC<SettingsProps> = ({ categories, onSaveCategory, onDeleteCategory }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'integrations' | 'modules'>('categories');
  
  // Modules & API Key State
  const [apiKey, setApiKey] = useState('');
  const [modules, setModules] = useState<UserSettings['modules']>({
    aiAssistant: false,
    voiceCommand: false,
    integrations: false,
    tts: false
  });

  // Categories State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    icon: 'MoreHorizontal',
    color: '#64748b',
    type: 'expense',
    accountScope: ['PF']
  });

  useEffect(() => {
    const loadSettings = async () => {
      const storedKey = StorageService.getApiKey();
      if (storedKey) setApiKey(storedKey);

      const settings = await StorageService.getSettings();
      if (settings.modules) setModules(settings.modules);
    };
    loadSettings();
  }, []);

  const saveModules = async (newModules: UserSettings['modules']) => {
    setModules(newModules);
    const currentSettings = await StorageService.getSettings();
    await StorageService.saveSettings({ ...currentSettings, modules: newModules });
  };

  const saveApiKey = () => {
    StorageService.saveApiKey(apiKey);
    alert("Chave de API salva com sucesso!");
  };

  const handleEdit = (cat: Category) => {
    setFormData(cat);
    setEditingId(cat.id);
    setShowModal(true);
  };

  const handleNew = () => {
    setFormData({
      name: '',
      icon: 'MoreHorizontal',
      color: '#64748b',
      type: 'expense',
      accountScope: ['PF']
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    const newCat: Category = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      icon: formData.icon || 'MoreHorizontal',
      color: formData.color || '#64748b',
      type: formData.type || 'expense',
      accountScope: formData.accountScope || ['PF'],
      isSystem: false // User created
    };

    onSaveCategory(newCat);
    setShowModal(false);
  };

  const initiateDelete = (id: string) => {
    setCatToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (catToDelete) {
      onDeleteCategory(catToDelete);
      setCatToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const toggleScope = (scope: AccountType) => {
    const current = formData.accountScope || [];
    if (current.includes(scope)) {
      setFormData({ ...formData, accountScope: current.filter(s => s !== scope) });
    } else {
      setFormData({ ...formData, accountScope: [...current, scope] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>
        
        <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 self-start overflow-x-auto max-w-full">
            <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-metal-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
            Categorias
            </button>
            <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'modules' ? 'bg-metal-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
            Módulos & IA
            </button>
            <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'integrations' ? 'bg-metal-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
            Integrações
            </button>
        </div>
      </div>

      {activeTab === 'categories' && (
        /* CATEGORIES CONTENT */
        <>
            <div className="flex justify-end mb-4">
                <button 
                onClick={handleNew}
                className="bg-metal-600 hover:bg-metal-500 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-lg shadow-metal-900/20"
                >
                <Plus size={18} className="mr-2" /> Nova Categoria
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(cat => {
                const Icon = getIconComponent(cat.icon);
                return (
                    <div key={cat.id} className={`bg-cardbg border ${cat.isSystem ? 'border-zinc-800/50 bg-zinc-900/30' : 'border-zinc-800'} p-4 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-all`}>
                    <div className="flex items-center">
                        <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                        <Icon size={20} />
                        </div>
                        <div>
                        <h4 className={`font-medium ${cat.isSystem ? 'text-zinc-400' : 'text-white'}`}>{cat.name} {cat.isSystem && <span className="text-[10px] ml-2 opacity-50">(Padrão)</span>}</h4>
                        <div className="flex gap-1 mt-1">
                            {cat.accountScope?.map(s => (
                            <span key={s} className="text-[10px] uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                                {s}
                            </span>
                            ))}
                            <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 ${cat.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {cat.type === 'income' ? 'Entrada' : 'Saída'}
                            </span>
                        </div>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => !cat.isSystem && handleEdit(cat)} 
                          disabled={!!cat.isSystem}
                          className={`p-2 rounded transition-colors ${cat.isSystem ? 'text-zinc-700 cursor-not-allowed' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                          title={cat.isSystem ? "Categorias padrão não podem ser editadas" : "Editar"}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => !cat.isSystem && initiateDelete(cat.id)} 
                          disabled={!!cat.isSystem}
                          className={`p-2 rounded transition-colors ${cat.isSystem ? 'text-zinc-700 cursor-not-allowed' : 'hover:bg-red-900/20 text-zinc-400 hover:text-red-400'}`}
                          title={cat.isSystem ? "Categorias padrão não podem ser excluídas" : "Excluir"}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    </div>
                );
                })}
            </div>
        </>
      )}
      
      {activeTab === 'modules' && (
          /* MODULES & AI CONTENT */
          <div className="space-y-6">
              <div className="bg-cardbg border border-zinc-800 p-6 rounded-xl">
                  <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-metal-500/10 rounded-xl text-metal-400">
                          <Key size={24} />
                      </div>
                      <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">Chave de API Gemini (Gratuita)</h3>
                          <p className="text-sm text-zinc-400 mt-1">
                              Para usar as funcionalidades de Inteligência Artificial sem custos, crie uma chave gratuita no Google AI Studio e cole abaixo.
                          </p>
                          <div className="mt-4 flex gap-2">
                              <input 
                                  type="password" 
                                  value={apiKey}
                                  onChange={e => setApiKey(e.target.value)}
                                  placeholder="Cole sua API Key aqui (ex: AIzaSy...)"
                                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-metal-500 outline-none"
                              />
                              <button 
                                  onClick={saveApiKey}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg border border-zinc-700 transition-colors"
                              >
                                  Salvar
                              </button>
                          </div>
                          <div className="mt-2 text-xs text-zinc-500 flex items-center">
                              <AlertTriangle size={12} className="mr-1 text-amber-500" />
                              Sua chave é salva apenas no navegador do seu dispositivo.
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* AI Module Toggle */}
                   <div className="bg-cardbg border border-zinc-800 p-5 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">IA & Scanner</h4>
                                <p className="text-xs text-zinc-500">Leitura de recibos e sugestão de categorias.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={modules?.aiAssistant} 
                                onChange={() => saveModules({...modules!, aiAssistant: !modules?.aiAssistant})} 
                                className="sr-only peer" 
                                disabled={!apiKey}
                            />
                            <div className={`w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${apiKey ? 'peer-checked:bg-purple-600' : 'opacity-50 cursor-not-allowed'}`}></div>
                        </label>
                   </div>

                   {/* Voice Module Toggle */}
                   <div className="bg-cardbg border border-zinc-800 p-5 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Comando de Voz</h4>
                                <p className="text-xs text-zinc-500">Gemini Live API para conversação em tempo real.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={modules?.voiceCommand} 
                                onChange={() => saveModules({...modules!, voiceCommand: !modules?.voiceCommand})} 
                                className="sr-only peer" 
                                disabled={!apiKey}
                            />
                            <div className={`w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${apiKey ? 'peer-checked:bg-amber-600' : 'opacity-50 cursor-not-allowed'}`}></div>
                        </label>
                   </div>
              </div>
          </div>
      )}

      {activeTab === 'integrations' && (
        /* INTEGRATIONS CONTENT */
        <div className="space-y-6">
            {/* Google Calendar */}
            <div className="bg-cardbg border border-zinc-800 p-6 rounded-xl flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">Google Agenda</h3>
                        <p className="text-sm text-zinc-400 mt-1 max-w-md">
                            Conecte sua agenda para identificar automaticamente datas de vencimento e agendar lembretes de pagamentos futuros baseados em seus eventos.
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={false} 
                        disabled
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-zinc-700 rounded-full opacity-50 cursor-not-allowed"></div>
                </label>
            </div>

            <div className="mt-8 p-4 bg-zinc-900/50 rounded border border-zinc-800 text-center text-sm text-zinc-500">
                Integrações externas requerem backend (Servidor). Disponível apenas na versão Pro hospedada.
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-red-900/30 w-full max-w-sm rounded-xl shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Excluir Categoria?</h3>
                <p className="text-zinc-400 text-sm mb-6">
                    Tem certeza que deseja excluir esta categoria? Transações antigas podem perder a referência. Esta ação não pode ser desfeita.
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

      {/* Edit/Create Modal */}
      {showModal && activeTab === 'categories' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 relative">
            
            {/* Help Button in Modal */}
            <div className="absolute top-4 left-4 z-50">
                 <button 
                    onMouseEnter={() => setShowHelp(true)}
                    onMouseLeave={() => setShowHelp(false)}
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-zinc-500 hover:text-metal-400 transition-colors"
                 >
                    <HelpCircle size={20} />
                 </button>
                 {showHelp && (
                    <div className="absolute top-8 left-0 w-64 bg-zinc-800 border border-zinc-700 p-3 rounded-lg shadow-xl text-xs text-zinc-300 z-50">
                        Defina o nome, cor e ícone para identificar seus lançamentos. Escolha se é uma categoria de Entrada ou Saída e em quais contas (PF/PJ) ela deve aparecer.
                    </div>
                 )}
            </div>

            <div className="p-6 border-b border-zinc-800 flex justify-between items-center pl-12">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Name & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-zinc-400 block mb-1">Nome</label>
                    <input 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white focus:border-metal-500 outline-none"
                        placeholder="Ex: Mercado"
                    />
                </div>
                <div>
                    <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                    <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white focus:border-metal-500 outline-none"
                    >
                        <option value="expense">Saída (Despesa)</option>
                        <option value="income">Entrada (Receita)</option>
                    </select>
                </div>
              </div>

              {/* Scope */}
              <div>
                <label className="text-xs text-zinc-400 block mb-2">Disponível em</label>
                <div className="flex gap-2">
                    {['PJ', 'PF', 'Premiação'].map(scope => (
                        <button
                            key={scope}
                            onClick={() => toggleScope(scope as AccountType)}
                            className={`px-3 py-1.5 rounded-lg text-sm border transition-all flex items-center ${
                                formData.accountScope?.includes(scope as AccountType) 
                                ? 'bg-metal-600 border-metal-500 text-white' 
                                : 'bg-zinc-950 border-zinc-700 text-zinc-400'
                            }`}
                        >
                            {formData.accountScope?.includes(scope as AccountType) && <Check size={14} className="mr-1.5" />}
                            {scope}
                        </button>
                    ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                 <label className="text-xs text-zinc-400 block mb-2">Cor</label>
                 <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => setFormData({...formData, color: c})}
                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${formData.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                 </div>
              </div>

              {/* Icons */}
              <div>
                 <label className="text-xs text-zinc-400 block mb-2">Ícone</label>
                 <div className="grid grid-cols-8 gap-2">
                    {Object.keys(ICON_MAP).map(iconKey => {
                        const Icon = getIconComponent(iconKey);
                        return (
                            <button
                                key={iconKey}
                                title={iconKey} // Added tooltip
                                onClick={() => setFormData({...formData, icon: iconKey})}
                                className={`p-2 rounded flex items-center justify-center transition-all hover:scale-110 ${formData.icon === iconKey ? 'bg-metal-600 text-white shadow-lg scale-110' : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'}`}
                            >
                                <Icon size={18} />
                            </button>
                        )
                    })}
                 </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-zinc-800">
                <button onClick={handleSave} className="w-full bg-metal-600 hover:bg-metal-500 text-white py-3 rounded-lg font-medium shadow-lg shadow-metal-900/20">
                    Salvar Categoria
                </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
