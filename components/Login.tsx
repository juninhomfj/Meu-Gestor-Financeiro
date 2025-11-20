import React, { useState } from 'react';
import { Landmark, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate fake auth delay
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Metallic Abstract Background */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-metal-800 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-metal-500 to-metal-700 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(14,165,233,0.4)]">
            <Landmark size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="text-zinc-500 mt-1">Acesse seu Gestor Financeiro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-metal-500 focus:ring-1 focus:ring-metal-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <div className="flex justify-between">
                <label className="text-sm font-medium text-zinc-400">Senha</label>
                <a href="#" className="text-xs text-metal-400 hover:text-metal-300">Esqueci a senha</a>
             </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-metal-500 focus:ring-1 focus:ring-metal-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-metal-600 to-metal-700 hover:from-metal-500 hover:to-metal-600 text-white font-medium py-3 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] transform hover:-translate-y-0.5 flex items-center justify-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Entrar <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
           <span className="text-zinc-500 text-sm">Não tem uma conta? </span>
           <button className="text-metal-400 hover:text-metal-300 text-sm font-medium">Cadastrar</button>
        </div>
      </div>
    </div>
  );
};

export default Login;