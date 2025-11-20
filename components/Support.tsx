
import React, { useState } from 'react';
import { LifeBuoy, Send, MessageSquare, Mail, Bot, Sparkles } from 'lucide-react';
import { AIService } from '../services/ai';

const Support: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ticket' | 'chat'>('chat');
  
  // Ticket Form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<{sender: 'user'|'agent', text: string}[]>([
    { sender: 'agent', text: 'Olá! Sou seu Consultor Financeiro IA (Gemini). Posso ajudar com análises complexas ou dúvidas sobre o sistema. Como posso ajudar?' }
  ]);

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:hypelab3@gmail.com?subject=[Suporte App] ${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      // Simulação de contexto do app (na versão real, passariamos os dados financeiros anonimizados)
      const context = "Usuário com perfil PF e PJ, focado em organização financeira.";
      const response = await AIService.getFinancialAdvice(userMsg, context);
      
      setChatHistory(prev => [...prev, { 
        sender: 'agent', 
        text: response || "Desculpe, não consegui processar sua solicitação." 
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        sender: 'agent', 
        text: "Tive um erro ao consultar a IA. Tente novamente." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-white flex items-center mb-2">
          <LifeBuoy className="mr-3 text-metal-400" /> Suporte & Consultoria
        </h2>
        <p className="text-zinc-400">Consultor IA especialista (Thinking Mode) ou suporte técnico.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-xl mb-6 w-fit border border-zinc-800 shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'chat' ? 'bg-metal-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <Bot size={16} className="mr-2" /> Consultor IA
        </button>
        <button
          onClick={() => setActiveTab('ticket')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${activeTab === 'ticket' ? 'bg-metal-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
        >
          <Mail size={16} className="mr-2" /> Abrir Ticket
        </button>
      </div>

      <div className="flex-1 bg-cardbg border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
        {activeTab === 'ticket' ? (
            <div className="p-6 md:p-8 h-full overflow-y-auto">
                <form onSubmit={handleSendTicket} className="space-y-6 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Assunto</label>
                        <input 
                            type="text"
                            required
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-metal-500 outline-none"
                            placeholder="Ex: Problema com sincronização"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Mensagem</label>
                        <textarea 
                            required
                            rows={6}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:border-metal-500 outline-none resize-none"
                            placeholder="Descreva seu problema ou sugestão detalhadamente..."
                        />
                    </div>
                    <button type="submit" className="bg-metal-600 hover:bg-metal-500 text-white py-3 px-6 rounded-lg font-medium flex items-center">
                        <Send size={18} className="mr-2" /> Enviar Email
                    </button>
                </form>
            </div>
        ) : (
            <div className="flex flex-col h-full">
                {/* Chat Area */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-zinc-950/50">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm relative ${
                                msg.sender === 'user' 
                                ? 'bg-metal-600 text-white rounded-tr-none' 
                                : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                            }`}>
                                {msg.sender === 'agent' && <Bot size={14} className="absolute -top-5 left-0 text-metal-400"/>}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-800 border border-zinc-700 rounded-xl rounded-tl-none p-3 flex items-center gap-2 text-xs text-zinc-400">
                          <Sparkles size={12} className="animate-pulse text-metal-400"/> Pensando...
                        </div>
                      </div>
                    )}
                </div>
                
                {/* Input Area */}
                <form onSubmit={handleSendChat} className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                    <input 
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-metal-500 outline-none"
                        placeholder="Ex: Como melhorar minha distribuição de lucro?"
                        disabled={isTyping}
                    />
                    <button type="submit" disabled={isTyping} className="bg-metal-600 hover:bg-metal-500 disabled:bg-zinc-800 text-white p-2.5 rounded-lg transition-colors">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
};

export default Support;
