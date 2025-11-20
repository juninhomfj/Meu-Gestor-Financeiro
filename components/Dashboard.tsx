
import React, { useMemo, useState } from 'react';
import { Transaction, AccountType, ReceivableItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Building2, User, PiggyBank, PlayCircle, StopCircle } from 'lucide-react';
import { AIService } from '../services/ai';

interface DashboardProps {
  transactions: Transaction[];
  receivables: ReceivableItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, receivables }) => {
  const [isPlayingSummary, setIsPlayingSummary] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let balancePJ = 0;
    let balancePF = 0;
    let balanceBonus = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(t => {
      if (t.status !== 'completed') return;

      const val = t.type === 'expense' ? -t.amount : t.amount;
      
      // Account Balances (Cumulative)
      if (t.accountOrigin === 'PJ') balancePJ += val;
      if (t.accountOrigin === 'PF') balancePF += val;
      if (t.accountOrigin === 'Premiação') balanceBonus += val;

      // Also check transfers destination
      if (t.type === 'transfer' && t.accountDestination) {
        if (t.accountDestination === 'PJ') balancePJ += t.amount;
        if (t.accountDestination === 'PF') balancePF += t.amount;
        if (t.accountDestination === 'Premiação') balanceBonus += t.amount;
      }

      // Monthly Stats
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear && t.type !== 'transfer') {
        if (t.type === 'income') monthIncome += t.amount;
        if (t.type === 'expense') monthExpense += t.amount;
      }
    });

    // Receivables Calculation (Pending/Provisioned)
    const totalReceivables = receivables.reduce((sum, item) => sum + (item.netAmount || 0), 0);

    return { balancePJ, balancePF, balanceBonus, monthIncome, monthExpense, totalReceivables };
  }, [transactions, receivables]);

  const chartData = useMemo(() => {
    const data = [
      { name: 'Entradas', value: stats.monthIncome, color: '#10b981' },
      { name: 'Saídas', value: stats.monthExpense, color: '#ef4444' },
    ];
    return data;
  }, [stats]);

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Generate and Play TTS Summary
  const handlePlaySummary = async () => {
    if (isPlayingSummary && audioElement) {
      audioElement.pause();
      setIsPlayingSummary(false);
      return;
    }

    setIsPlayingSummary(true);
    try {
      const summaryText = `Aqui está o seu resumo financeiro rápido. Seu saldo na conta PJ é de ${Math.round(stats.balancePJ)} reais. Na conta PF, você tem ${Math.round(stats.balancePF)} reais. O saldo de premiação é de ${Math.round(stats.balanceBonus)} reais. Neste mês, entraram ${Math.round(stats.monthIncome)} reais e saíram ${Math.round(stats.monthExpense)} reais. Você tem ${Math.round(stats.totalReceivables)} reais a receber.`;
      
      const base64Audio = await AIService.generateSpeech(summaryText);
      
      // Decode Base64 to Blob -> URL
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      setAudioElement(audio);
      audio.play();
      audio.onended = () => setIsPlayingSummary(false);
      
    } catch (error) {
      console.error("TTS Error", error);
      setIsPlayingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
        <button 
          onClick={handlePlaySummary}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isPlayingSummary ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-metal-600/20 text-metal-400 border border-metal-500/50 hover:bg-metal-600/30'}`}
        >
          {isPlayingSummary ? <StopCircle size={16} /> : <PlayCircle size={16} />}
          {isPlayingSummary ? 'Parar Resumo' : 'Ouvir Resumo'}
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* A-Receber Card */}
        <div className="bg-cardbg border border-metal-900/50 p-5 rounded-xl relative overflow-hidden group shadow-[0_0_20px_rgba(14,165,233,0.1)] transition-all hover:border-metal-500/50">
           <div className="absolute inset-0 bg-gradient-to-br from-metal-600/20 to-transparent opacity-50" />
           <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-metal-500/10 rounded-lg text-metal-400">
              <PiggyBank size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">A-Receber</span>
          </div>
          <div className="text-2xl font-bold text-white relative z-10">{formatMoney(stats.totalReceivables)}</div>
          <div className="text-xs text-metal-400 mt-1 relative z-10">Provisão futura</div>
        </div>

        {/* PJ Card */}
        <div className="bg-cardbg border border-zinc-800 p-5 rounded-xl relative overflow-hidden group transition-all hover:border-indigo-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Building2 size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Conta PJ</span>
          </div>
          <div className="text-2xl font-bold text-white relative z-10">{formatMoney(stats.balancePJ)}</div>
          <div className="text-xs text-zinc-500 mt-1 relative z-10">Saldo atual disponível</div>
        </div>

        {/* PF Card */}
        <div className="bg-cardbg border border-zinc-800 p-5 rounded-xl relative overflow-hidden group transition-all hover:border-emerald-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <User size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Conta PF</span>
          </div>
          <div className="text-2xl font-bold text-white relative z-10">{formatMoney(stats.balancePF)}</div>
          <div className="text-xs text-zinc-500 mt-1 relative z-10">Saldo atual disponível</div>
        </div>

        {/* Bonus Card */}
        <div className="bg-cardbg border border-zinc-800 p-5 rounded-xl relative overflow-hidden group transition-all hover:border-amber-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <CreditCard size={24} />
            </div>
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">Cartão Premiação</span>
          </div>
          <div className="text-2xl font-bold text-white relative z-10">{formatMoney(stats.balanceBonus)}</div>
          <div className="text-xs text-zinc-500 mt-1 relative z-10">Saldo acumulado</div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cardbg border border-zinc-800 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-metal-400" />
            Entradas e Saídas do Mês
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                 <XAxis type="number" stroke="#71717a" fontSize={12} tickFormatter={(val) => `R$ ${val/1000}k`} />
                 <YAxis dataKey="name" type="category" stroke="#e4e4e7" fontSize={14} width={80} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{fill: 'transparent'}}
                 />
                 <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-cardbg border border-zinc-800 p-6 rounded-xl flex flex-col justify-center">
           <h3 className="text-lg font-medium text-white mb-6">Resumo Rápido</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-3">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-zinc-300">Entradas</span>
                </div>
                <span className="font-bold text-emerald-500">{formatMoney(stats.monthIncome)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mr-3">
                    <TrendingDown size={16} />
                  </div>
                  <span className="text-zinc-300">Saídas</span>
                </div>
                <span className="font-bold text-red-500">{formatMoney(stats.monthExpense)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 mt-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-metal-500/10 flex items-center justify-center text-metal-500 mr-3">
                    <Wallet size={16} />
                  </div>
                  <span className="text-zinc-300">Balanço</span>
                </div>
                <span className={`font-bold ${stats.monthIncome - stats.monthExpense >= 0 ? 'text-metal-400' : 'text-red-400'}`}>
                  {formatMoney(stats.monthIncome - stats.monthExpense)}
                </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
