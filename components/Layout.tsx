import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  ArrowRightLeft, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Landmark,
  Mic,
  HelpCircle,
  Bell,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  LifeBuoy,
  Inbox
} from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';
import { Transaction } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  onAddTransaction: (tx: Transaction) => void;
  user: { name: string; email: string };
  transactions: Transaction[]; // Added for notifications
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, onAddTransaction, user, transactions = [] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receivables', label: 'Gestão de Receitas', icon: Landmark },
    { id: 'distribution', label: 'Distribuição', icon: PieChart },
    { id: 'transactions', label: 'Transações', icon: Wallet },
    { id: 'approvals', label: 'Aprovações', icon: Inbox },
    { id: 'transfers', label: 'Transferências', icon: ArrowRightLeft },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'help', label: 'Ajuda & Tutoriais', icon: BookOpen },
    { id: 'support', label: 'Suporte', icon: LifeBuoy },
  ];

  // Notification Logic
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    return transactions.filter(t => {
      if (t.status === 'completed') return false;
      const tDate = new Date(t.date);
      // Show if Pending AND (Overdue OR Due within 3 days)
      return tDate <= threeDaysFromNow;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getPageInfo = () => {
    switch(currentView) {
        case 'dashboard': return "Visão geral das suas contas, saldos e gráficos de movimentação do mês.";
        case 'receivables': return "Cadastro de entradas brutas (Receitas Master) e descontos automáticos ou manuais antes da distribuição.";
        case 'distribution': return "Ferramenta para dividir seu lucro líquido entre conta PF, PJ e Reserva/Premiação.";
        case 'transactions': return "Histórico completo de entradas e saídas detalhadas por categoria. Use os filtros para buscar lançamentos específicos.";
        case 'approvals': return "Caixa de entrada para boletos escaneados ou itens que precisam de categorização antes de virarem transações.";
        case 'settings': return "Gerencie categorias personalizadas e conecte serviços externos (Agenda/WhatsApp).";
        case 'help': return "Central de documentação e tutoriais para aprender a usar o sistema.";
        case 'support': return "Entre em contato com nossa equipe via email ou chat.";
        default: return "Gerencie suas finanças de forma eficiente.";
    }
  };

  return (
    <div className="min-h-screen bg-darkbg text-zinc-100 flex font-sans">
      {/* Voice Assistant Overlay */}
      <VoiceAssistant 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        onAddTransaction={onAddTransaction}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-cardbg border-r border-zinc-800
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-900">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-metal-500 to-metal-700 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <Landmark size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-metal-50">Meu<span className="text-metal-400">Gestor</span></span>
            <button onClick={toggleSidebar} className="ml-auto lg:hidden text-zinc-400">
              <X size={24} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {/* Mic Button (Sidebar) */}
            <button
               onClick={() => { setIsVoiceOpen(true); setIsSidebarOpen(false); }}
               className="w-full flex items-center px-4 py-3 mb-4 rounded-xl bg-gradient-to-r from-metal-600/20 to-metal-500/20 border border-metal-500/30 text-metal-400 hover:bg-metal-500/30 transition-all group"
            >
               <Mic size={20} className="mr-3 group-hover:scale-110 transition-transform" />
               <span className="font-medium text-sm">Comando de Voz</span>
            </button>

            <div className="h-px bg-zinc-800 my-4" />

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-metal-900/50 text-metal-400 border border-metal-800/50 shadow-lg shadow-metal-900/20' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}
                  `}
                >
                  <Icon size={20} className={`mr-3 ${isActive ? 'text-metal-400' : ''}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-metal-400 font-bold border border-zinc-700">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white truncate max-w-[140px] capitalize">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate max-w-[140px]">Gestor Financeiro</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-900 hover:bg-red-900/20 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800 hover:border-red-900/30"
            >
              <LogOut size={16} className="mr-2" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-cardbg border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 z-20">
            <div className="flex items-center lg:hidden">
                <button onClick={toggleSidebar} className="text-zinc-400 mr-4">
                    <Menu size={24} />
                </button>
                <span className="font-bold text-white">Meu Gestor</span>
            </div>
            
            {/* Desktop Title/Info */}
            <div className="hidden lg:flex items-center text-zinc-400">
                 <span className="text-sm border-l border-zinc-700 pl-4 ml-4">
                    {getPageInfo()}
                 </span>
            </div>

            <div className="flex items-center gap-3">
                 {/* Notification Bell */}
                 <div className="relative">
                    <button 
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 flex items-center justify-center transition-colors"
                    >
                      <Bell size={16} />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-cardbg">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsNotifOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-3 border-b border-zinc-800 bg-zinc-900/50">
                            <h4 className="text-sm font-bold text-white">Notificações</h4>
                            <p className="text-xs text-zinc-500">Contas a vencer ou atrasadas</p>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="p-6 text-center text-zinc-500 text-sm">
                                <CheckCircle2 size={24} className="mx-auto mb-2 text-zinc-700" />
                                Nenhuma pendência próxima!
                              </div>
                            ) : (
                              notifications.map(notif => {
                                const isOverdue = new Date(notif.date) < new Date(new Date().setHours(0,0,0,0));
                                return (
                                  <div key={notif.id} className="p-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors flex items-start">
                                     <div className={`mt-1 p-1.5 rounded-full mr-3 ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                       <AlertTriangle size={14} />
                                     </div>
                                     <div>
                                       <p className="text-sm font-medium text-zinc-200">{notif.title}</p>
                                       <p className="text-xs text-zinc-500">
                                         {isOverdue ? 'Venceu em: ' : 'Vence em: '} {new Date(notif.date).toLocaleDateString()}
                                       </p>
                                       <p className={`text-xs font-bold mt-0.5 ${notif.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                                          R$ {notif.amount.toFixed(2)}
                                       </p>
                                     </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                      </>
                    )}
                 </div>

                 <button 
                    onClick={() => setIsInfoOpen(!isInfoOpen)}
                    className="lg:hidden w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700"
                 >
                    <HelpCircle size={16} />
                 </button>
                 <button 
                    onClick={() => setIsVoiceOpen(true)}
                    className="w-8 h-8 rounded-full bg-metal-600/20 text-metal-400 flex items-center justify-center border border-metal-500/30 lg:hidden"
                 >
                    <Mic size={16} />
                 </button>
                 <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs">
                    {user.name.charAt(0).toUpperCase()}
                 </div>
            </div>
        </header>
        
        {/* Info Banner Mobile */}
        {isInfoOpen && (
            <div className="bg-metal-900/30 border-b border-metal-800 p-4 text-sm text-zinc-300 lg:hidden flex justify-between items-start">
                <div className="flex gap-2">
                    <HelpCircle size={16} className="text-metal-400 shrink-0 mt-0.5" />
                    <p>{getPageInfo()}</p>
                </div>
                <button onClick={() => setIsInfoOpen(false)}><X size={16} className="text-zinc-500" /></button>
            </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          <div className="max-w-6xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6 lg:hidden">
               <h2 className="text-xl font-bold text-white capitalize">{currentView === 'receivables' ? 'Gestão de Receitas' : (navItems.find(i => i.id === currentView)?.label || currentView)}</h2>
            </div>
            
            {/* Desktop Page Title with Info Button */}
            <div className="hidden lg:flex justify-between items-center mb-8">
                 <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {navItems.find(i => i.id === currentView)?.label || 'Gestor'}
                    <div className="group relative">
                        <HelpCircle size={18} className="text-zinc-600 cursor-help hover:text-metal-400 transition-colors" />
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                            <p className="text-xs text-zinc-300 leading-relaxed">{getPageInfo()}</p>
                            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-900 border-l border-b border-zinc-700 rotate-45"></div>
                        </div>
                    </div>
                 </h1>
            </div>

            {children}
          </div>
        </main>

        {/* Global Floating Action Button for Voice */}
        <button 
            onClick={() => setIsVoiceOpen(true)}
            className={`
                fixed bottom-6 right-24 lg:bottom-8 lg:right-24 w-16 h-16 rounded-full 
                text-white border flex items-center justify-center transition-all 
                hover:scale-105 z-30 shadow-[0_0_20px_rgba(14,165,233,0.5)]
                ${isVoiceOpen 
                    ? 'bg-red-500 border-red-400 animate-pulse ring-4 ring-red-500/20' 
                    : 'bg-gradient-to-br from-metal-500 to-metal-700 hover:from-metal-400 hover:to-metal-600 border-metal-400/50'
                }
            `}
            title="Comando de Voz"
        >
            {isVoiceOpen ? <Mic size={28} className="animate-bounce" /> : <Mic size={28} />}
        </button>
      </div>
    </div>
  );
};

export default Layout;