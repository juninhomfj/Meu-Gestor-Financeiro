import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Receivables from './components/Receivables';
import Distribution from './components/Distribution';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import HelpCenter from './components/HelpCenter';
import Support from './components/Support';
import { StorageService } from './services/storage';
import { Transaction, Category, AccountType, ReceivableItem } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [view, setView] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Global State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  
  // Distribution State Hook
  const [pendingDistribution, setPendingDistribution] = useState<{amount: number, source: string} | null>(null);

  // Initial Load with Promise.all
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [u, txs, cats, recs] = await Promise.all([
           Promise.resolve(StorageService.getUser()), // Wrap sync call or make storage async
           StorageService.getTransactions(),
           StorageService.getCategories(),
           StorageService.getReceivables()
        ]);

        if (u) {
            setUser(u);
            if (!StorageService.hasSeenOnboarding()) {
                setShowOnboarding(true);
            }
        }

        setTransactions(txs);
        setCategories(cats);
        setReceivables(recs);
      } catch (error) {
        console.error("Failed to load application data", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = async (email: string) => {
    const u = await StorageService.login(email);
    setUser(u);
    // Check onboarding on fresh login
    if (!StorageService.hasSeenOnboarding()) {
        setShowOnboarding(true);
    }
  };

  const handleLogout = async () => {
    await StorageService.logout();
    setUser(null);
  };

  const handleCloseOnboarding = () => {
    StorageService.setOnboardingSeen();
    setShowOnboarding(false);
  };

  const handleAddTransaction = async (tx: Transaction) => {
    await StorageService.saveTransaction(tx);
    setTransactions(prev => [...prev, tx]);
  };

  const handleUpdateTransaction = async (tx: Transaction) => {
    await StorageService.saveTransaction(tx); // Save handles update if ID exists
    setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
  };

  const handleDeleteTransaction = async (id: string) => {
    await StorageService.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleSaveCategory = async (cat: Category) => {
    // Optimistic update
    let newCats = [...categories];
    const index = newCats.findIndex(c => c.id === cat.id);
    if (index >= 0) {
        newCats[index] = cat;
    } else {
        newCats.push(cat);
    }
    setCategories(newCats);
    await StorageService.saveCategory(cat);
  };

  const handleDeleteCategory = async (id: string) => {
     const newCats = categories.filter(c => c.id !== id);
     setCategories(newCats);
     localStorage.setItem('mgf_categories', JSON.stringify(newCats));
  };

  const handleReceivableToDistribution = (amount: number, source: string) => {
    const newItem: ReceivableItem = {
      id: crypto.randomUUID(),
      title: source,
      description: 'Entrada Processada',
      grossAmount: amount,
      date: new Date().toISOString(),
      discounts: [],
      status: 'provisioned',
      netAmount: amount
    };
    StorageService.saveReceivable(newItem);
    setReceivables(prev => [...prev, newItem]);

    setPendingDistribution({ amount, source });
    setView('distribution');
  };

  const handleConfirmDistribution = async (dist: { pj: number, pf: number, bonus: number }) => {
    const date = new Date().toISOString();
    const sourceTitle = pendingDistribution?.source || 'Distribuição Manual';
    
    const txs: Transaction[] = [
        {
            id: crypto.randomUUID(),
            title: `Dist. PJ: ${sourceTitle}`,
            amount: dist.pj,
            type: 'income',
            category: 'cat_pj_input',
            accountOrigin: 'PJ',
            date,
            status: 'completed',
            recurrence: 'none'
        },
        {
            id: crypto.randomUUID(),
            title: `Dist. PF: ${sourceTitle}`,
            amount: dist.pf,
            type: 'income',
            category: 'cat_pf_input',
            accountOrigin: 'PF',
            date,
            status: 'completed',
            recurrence: 'none'
        },
        {
            id: crypto.randomUUID(),
            title: `Dist. Bônus: ${sourceTitle}`,
            amount: dist.bonus,
            type: 'income',
            category: 'cat_bonus_input',
            accountOrigin: 'Premiação',
            date,
            status: 'completed',
            recurrence: 'none'
        }
    ];

    for (const t of txs) {
        await StorageService.saveTransaction(t);
    }
    setTransactions(prev => [...prev, ...txs]);
    setPendingDistribution(null);
    setView('dashboard');
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-darkbg flex items-center justify-center">
              <div className="text-center">
                  <Loader2 size={48} className="text-metal-500 animate-spin mx-auto mb-4" />
                  <p className="text-zinc-400 text-sm">Carregando seu gestor financeiro...</p>
              </div>
          </div>
      )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard transactions={transactions} receivables={receivables} />;
      case 'transactions':
        return (
            <Transactions 
                transactions={transactions} 
                categories={categories} 
                onAdd={handleAddTransaction}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
            />
        );
      case 'receivables':
        return <Receivables onSaveForDistribution={handleReceivableToDistribution} />;
      case 'distribution':
        return (
            <Distribution 
                initialAmount={pendingDistribution?.amount || 0} 
                sourceName={pendingDistribution?.source}
                onConfirm={handleConfirmDistribution} 
            />
        );
      case 'settings':
        return (
            <Settings 
                categories={categories} 
                onSaveCategory={handleSaveCategory}
                onDeleteCategory={handleDeleteCategory}
            />
        );
      case 'help':
        return <HelpCenter />;
      case 'support':
        return <Support />;
      default:
        return <div className="text-white">Em construção: {view}</div>;
    }
  };

  return (
    <>
        {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
        <Layout 
            currentView={view} 
            onChangeView={setView} 
            onLogout={handleLogout}
            user={user}
            onAddTransaction={handleAddTransaction}
            transactions={transactions}
        >
            {renderView()}
        </Layout>
    </>
  );
};

export default App;