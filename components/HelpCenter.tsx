import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';

const HelpCenter: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const tutorials = [
    {
      title: "Começando: O Fluxo Financeiro Ideal",
      content: "O aplicativo foi desenhado para separar suas entidades. Todo dinheiro entra primeiro na 'Gestão de Receitas' (Conta Master). Lá você abate impostos e custos. O valor líquido é então enviado para 'Distribuição', onde você separa o que é da Empresa (PJ), o que é seu (PF) e o que é reserva (Premiação)."
    },
    {
      title: "Como usar a Gestão de Receitas?",
      content: "Acesse 'Gestão de Receitas' no menu. Clique em Configurações (engrenagem) para definir impostos fixos (ex: 6% DAS). Ao lançar um valor bruto, o sistema desconta automaticamente. Clique em 'Processar' para enviar o valor líquido para a tela de Distribuição."
    },
    {
      title: "Comandos de Voz com IA",
      content: "Clique no ícone de microfone (canto inferior direito ou menu). Diga comandos naturais como: 'Gastei 40 reais no Uber na conta PF' ou 'Recebi 5 mil reais de consultoria'. A IA entende o contexto, categoriza e cria o lançamento."
    },
    {
      title: "Integração com WhatsApp e Google",
      content: "Nas configurações, você pode conectar sua agenda para prever gastos futuros ou o WhatsApp para receber relatórios semanais. (Funcionalidade em Beta)."
    },
    {
      title: "Criando Categorias Personalizadas",
      content: "Vá em Configurações > Categorias. Clique em 'Nova Categoria', escolha um ícone, uma cor e defina se é Despesa ou Receita e em quais contas ela deve aparecer."
    }
  ];

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center mb-2">
          <BookOpen className="mr-3 text-metal-400" /> Central de Ajuda
        </h2>
        <p className="text-zinc-400">Documentação completa e tutoriais para dominar o sistema.</p>
      </div>

      <div className="space-y-4">
        {tutorials.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`bg-cardbg border ${isOpen ? 'border-metal-500/50' : 'border-zinc-800'} rounded-xl overflow-hidden transition-all duration-200`}
            >
              <button 
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-800/30 transition-colors"
              >
                <span className={`font-medium ${isOpen ? 'text-white' : 'text-zinc-300'}`}>
                  {item.title}
                </span>
                {isOpen ? <ChevronUp size={20} className="text-metal-400" /> : <ChevronDown size={20} className="text-zinc-500" />}
              </button>
              
              {isOpen && (
                <div className="p-5 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 bg-zinc-900/30">
                   <div className="mb-4">{item.content}</div>
                   <button className="text-xs text-metal-400 flex items-center hover:text-metal-300">
                      <PlayCircle size={14} className="mr-1.5" /> Assistir vídeo tutorial
                   </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-gradient-to-r from-metal-900/50 to-zinc-900 border border-metal-900 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h3 className="text-lg font-bold text-white">Ainda com dúvidas?</h3>
            <p className="text-sm text-zinc-400">Nossa equipe de suporte está pronta para ajudar.</p>
        </div>
        <button className="bg-white text-black px-6 py-2.5 rounded-lg font-bold hover:bg-zinc-200 transition-colors">
            Falar com Suporte
        </button>
      </div>
    </div>
  );
};

export default HelpCenter;