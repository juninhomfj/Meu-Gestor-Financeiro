import { Transaction, Category, ReceivableItem, UserSettings } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../constants';

// Keys
const KEYS = {
  TRANSACTIONS: 'mgf_transactions',
  CATEGORIES: 'mgf_categories',
  RECEIVABLES: 'mgf_receivables',
  SETTINGS: 'mgf_settings',
  USER: 'mgf_user',
  ONBOARDING: 'mgf_onboarding_seen',
  API_KEY: 'mgf_custom_api_key'
};

// Helper to simulate async delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const StorageService = {
  // Transactions
  getTransactions: async (): Promise<Transaction[]> => {
    await delay(200);
    const data = localStorage.getItem(KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  saveTransaction: async (tx: Transaction): Promise<void> => {
    await delay(200);
    const txs = await StorageService.getTransactions();
    const existingIndex = txs.findIndex(t => t.id === tx.id);
    if (existingIndex >= 0) {
      txs[existingIndex] = tx;
    } else {
      txs.push(tx);
    }
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const txs = await StorageService.getTransactions();
    const filtered = txs.filter(t => t.id !== id);
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(filtered));
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    await delay(100);
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },

  saveCategory: async (cat: Category): Promise<void> => {
    const cats = await StorageService.getCategories();
    cats.push(cat);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats));
  },

  // Receivables (Master)
  getReceivables: async (): Promise<ReceivableItem[]> => {
    await delay(200);
    const data = localStorage.getItem(KEYS.RECEIVABLES);
    return data ? JSON.parse(data) : [];
  },

  saveReceivable: async (item: ReceivableItem): Promise<void> => {
    const items = await StorageService.getReceivables();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    localStorage.setItem(KEYS.RECEIVABLES, JSON.stringify(items));
  },

  // Settings
  getSettings: async (): Promise<UserSettings> => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    // Merge with default in case new keys are added later
    const stored = data ? JSON.parse(data) : {};
    return { ...DEFAULT_SETTINGS, ...stored };
  },

  saveSettings: async (settings: UserSettings): Promise<void> => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Custom API Key
  getApiKey: (): string | null => {
    return localStorage.getItem(KEYS.API_KEY);
  },

  saveApiKey: (key: string) => {
    localStorage.setItem(KEYS.API_KEY, key);
  },

  // Auth (Mock)
  login: async (email: string): Promise<{ email: string; name: string }> => {
    await delay(800);
    if (email) {
      const user = { email, name: email.split('@')[0] };
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      return user;
    }
    throw new Error('Invalid email');
  },

  logout: async () => {
    localStorage.removeItem(KEYS.USER);
  },

  getUser: () => {
    const u = localStorage.getItem(KEYS.USER);
    return u ? JSON.parse(u) : null;
  },

  // Onboarding
  hasSeenOnboarding: (): boolean => {
    return localStorage.getItem(KEYS.ONBOARDING) === 'true';
  },

  setOnboardingSeen: () => {
    localStorage.setItem(KEYS.ONBOARDING, 'true');
  }
};