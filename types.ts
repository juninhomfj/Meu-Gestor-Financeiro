
export type AccountType = 'PJ' | 'PF' | 'Premiação' | 'Master';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionStatus = 'provisioned' | 'pending' | 'completed';

export type RecurrenceType = 'none' | 'weekly' | 'monthly' | 'annual';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isSystem?: boolean; // Prevent deletion of default cats
  accountScope?: AccountType[]; // If specific to PJ or PF
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string; // Category ID
  subcategory?: string;
  date: string; // ISO Date string (YYYY-MM-DD)
  dueDate?: string; // For bills
  status: TransactionStatus;
  accountOrigin: AccountType;
  accountDestination?: AccountType; // For transfers
  recurrence: RecurrenceType;
  recurrenceEnd?: string; // Optional end date for recurrence
  description?: string;
}

export interface ReceivableItem {
  id: string;
  title: string;
  description: string;
  grossAmount: number;
  date: string;
  discounts: {
    id: string;
    description: string;
    amount: number;
    type: string; // e.g., 'Tax', 'Fee'
  }[];
  status: TransactionStatus;
  netAmount: number;
}

export interface UserSettings {
  enableDistributionSuggestion: boolean;
  enableBonusCard: boolean;
  distributionSplit: {
    pj: number;
    pf: number;
    bonus: number;
  };
  modules?: {
    aiAssistant: boolean;
    voiceCommand: boolean;
    integrations: boolean;
    tts: boolean;
  };
}
