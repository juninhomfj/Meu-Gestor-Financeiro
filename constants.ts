import { Category, UserSettings } from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  enableDistributionSuggestion: true,
  enableBonusCard: true,
  distributionSplit: {
    pj: 30,
    pf: 60,
    bonus: 10
  },
  // Modules disabled by default for zero-cost / zero-config start
  modules: {
    aiAssistant: false, // Chatbot & Receipt Scan
    voiceCommand: false, // Live API
    integrations: false,
    tts: false // Text-to-speech
  }
};

export const DEFAULT_CATEGORIES: Category[] = [
  // New Custom Category
  { id: 'cat_invest', name: 'Investimentos', icon: 'TrendingUp', color: '#10b981', type: 'income', accountScope: ['PJ', 'PF'] },

  // PJ
  { id: 'cat_pj_input', name: 'Receita PJ', icon: 'TrendingUp', color: '#10b981', type: 'income', accountScope: ['PJ'] },
  { id: 'cat_pj_simples', name: 'Simples Nacional', icon: 'FileText', color: '#ef4444', type: 'expense', accountScope: ['PJ'] },
  { id: 'cat_pj_darf', name: 'DARF IRPF', icon: 'FileSpreadsheet', color: '#ef4444', type: 'expense', accountScope: ['PJ'] },
  { id: 'cat_pj_core', name: 'CORE', icon: 'Briefcase', color: '#f59e0b', type: 'expense', accountScope: ['PJ'] },
  { id: 'cat_pj_expenses', name: 'Despesas Mensais PJ', icon: 'Building', color: '#6366f1', type: 'expense', accountScope: ['PJ'] },
  
  // PF
  { id: 'cat_pf_input', name: 'Receita PF', icon: 'TrendingUp', color: '#10b981', type: 'income', accountScope: ['PF'] },
  { id: 'cat_pf_rent', name: 'Aluguel', icon: 'Home', color: '#f97316', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_energy', name: 'Energia', icon: 'Zap', color: '#eab308', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_water', name: 'Água', icon: 'Droplet', color: '#3b82f6', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_phone', name: 'Celular', icon: 'Smartphone', color: '#8b5cf6', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_car', name: 'Parcela Carro', icon: 'Car', color: '#ef4444', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_health', name: 'Convênio', icon: 'Heart', color: '#ec4899', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_groceries', name: 'Mantimentos', icon: 'ShoppingCart', color: '#14b8a6', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_school', name: 'Escola Miguel', icon: 'GraduationCap', color: '#84cc16', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_fuel', name: 'Combustível', icon: 'Fuel', color: '#f59e0b', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_internet', name: 'Internet', icon: 'Wifi', color: '#6366f1', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_pets', name: 'Ração Cachorros', icon: 'Dog', color: '#78716c', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_insurance', name: 'Seguro Automóvel', icon: 'Shield', color: '#0ea5e9', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_personal', name: 'Cuidados Pessoais', icon: 'Smile', color: '#f472b6', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_leisure', name: 'Lazer', icon: 'Coffee', color: '#a855f7', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_sarah', name: 'Sarah', icon: 'User', color: '#ec4899', type: 'expense', accountScope: ['PF'] },
  { id: 'cat_pf_misc', name: 'Diversos', icon: 'MoreHorizontal', color: '#94a3b8', type: 'expense', accountScope: ['PF'] },

  // Bonus
  { id: 'cat_bonus_input', name: 'Entrada Premiação', icon: 'Gift', color: '#10b981', type: 'income', accountScope: ['Premiação'] },
  { id: 'cat_bonus_expense', name: 'Gasto Premiação', icon: 'CreditCard', color: '#ef4444', type: 'expense', accountScope: ['Premiação'] },
  
  // Transfer
  { id: 'cat_transfer', name: 'Transferência', icon: 'ArrowRightLeft', color: '#64748b', type: 'expense', accountScope: ['PJ', 'PF', 'Premiação'] },
];