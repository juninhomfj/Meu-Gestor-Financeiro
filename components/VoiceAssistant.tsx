import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, X, Radio, Activity, Zap } from 'lucide-react';
import { Transaction } from '../types';
import { StorageService } from '../services/storage';

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Transaction) => void;
}

// --- Audio Utilities (Encoding/Decoding) ---
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, onAddTransaction }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'processing'>('connecting');
  const [volume, setVolume] = useState(0);
  
  // Refs for Audio & AI
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Tool Definition
  const addTransactionTool: FunctionDeclaration = {
    name: 'addTransaction',
    description: 'Adiciona uma nova transação financeira (receita ou despesa) baseada no comando de voz do usuário.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Descrição curta da transação (ex: Almoço, Cliente X)' },
        amount: { type: Type.NUMBER, description: 'Valor numérico da transação' },
        type: { type: Type.STRING, enum: ['income', 'expense'], description: 'Tipo: Entrada (income) ou Saída (expense)' },
        account: { type: Type.STRING, enum: ['PF', 'PJ', 'Premiação'], description: 'Conta de origem/destino. Se não especificado, perguntar ou assumir PF.' }
      },
      required: ['title', 'amount', 'type']
    },
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startSession();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (sessionRef.current) {
        // sessionRef.current.close(); 
        sessionRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setVolume(0);
  };

  const startSession = async () => {
    setStatus('connecting');
    try {
      const storedKey = StorageService.getApiKey();
      const envKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      const apiKey = storedKey || envKey;

      if (!apiKey) {
        alert("Chave de API não encontrada. Configure sua chave em Configurações > Módulos.");
        onClose();
        return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      // Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [addTransactionTool] }],
          systemInstruction: "Você é um assistente financeiro eficiente. Quando o usuário pedir para adicionar uma despesa ou receita, chame a função 'addTransaction'. Confirme a ação por voz. Seja breve. Fale português do Brasil.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            
            // Stream Mic Input
            if (!inputAudioContextRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Volume Calculation for Visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 5000, 100)); // Amplify for visualization

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Tool Calls (Transaction Addition)
            if (msg.toolCall) {
              setStatus('processing');
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'addTransaction') {
                  const args = fc.args as any;
                  
                  // Create Transaction Object
                  const newTx: Transaction = {
                    id: crypto.randomUUID(),
                    title: args.title,
                    amount: args.amount,
                    type: args.type,
                    accountOrigin: args.account || 'PF',
                    category: args.type === 'income' ? 'cat_pf_input' : 'cat_pf_misc', // Default to misc/input
                    date: new Date().toISOString(),
                    status: 'completed',
                    recurrence: 'none'
                  };

                  onAddTransaction(newTx);

                  // Send confirmation back to model
                  sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Sucesso" }
                    }
                  }));
                }
              }
            }

            // Handle Audio Output (TTS)
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              setStatus('speaking');
              const ctx = outputAudioContextRef.current;
              
              // Sync playback
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(audioData),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => {
                 sourcesRef.current.delete(source);
                 // Slightly delayed status reset to prevent flickering between chunks
                 setTimeout(() => {
                    if (sourcesRef.current.size === 0) setStatus('listening');
                 }, 200);
              };
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => {
             setStatus('connecting');
          },
          onerror: (err) => {
             console.error("Gemini Live Error:", err);
             onClose();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start voice session", error);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-zinc-900 border border-metal-500/30 rounded-3xl p-8 w-full max-w-sm text-center shadow-[0_0_50px_rgba(14,165,233,0.15)] overflow-hidden">
        
        {/* Background Abstract Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-metal-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="mb-8 mt-4 flex justify-center relative">
          <div className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'speaking' ? 'bg-metal-500/20 scale-110' : 'bg-zinc-800'}`}>
            
            {/* Connecting Animation */}
            {status === 'connecting' && (
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-zinc-600 animate-spin" />
            )}

            {/* Listening Pulse */}
            {status === 'listening' && (
               <div className="absolute inset-0 rounded-full border border-metal-500 opacity-50 animate-[ping_2s_linear_infinite]" />
            )}
            
            {/* Speaking Glow */}
            {status === 'speaking' && (
               <div className="absolute inset-0 rounded-full bg-metal-400 opacity-30 animate-pulse" />
            )}
            
            <Mic size={40} className={`transition-colors ${status === 'listening' || status === 'speaking' ? 'text-metal-400' : 'text-zinc-400'}`} />
            
            {status === 'processing' && (
                <div className="absolute bottom-0 right-0 bg-metal-600 rounded-full p-1 border border-zinc-900 animate-bounce">
                    <Zap size={12} className="text-white" />
                </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 transition-all">
          {status === 'connecting' && "Conectando..."}
          {status === 'listening' && "Ouvindo..."}
          {status === 'processing' && "Processando..."}
          {status === 'speaking' && "Assistente Falando"}
        </h3>
        
        <p className="text-zinc-400 text-xs mb-8 h-10">
          Diga: "Adicione um gasto de 30 reais na farmácia" ou "Recebi 2000 reais".
        </p>

        {/* Audio Visualizer Bars */}
        <div className="h-16 flex items-end justify-center gap-1.5">
           {[...Array(7)].map((_, i) => {
              // Create a symmetric visualizer effect
              const heightMultiplier = status === 'listening' ? Math.max(0.2, (volume / 100) * (Math.random() + 0.5)) : 0.1;
              const isMiddle = i === 3;
              const isEdge = i === 0 || i === 6;
              
              let h = 60 * heightMultiplier;
              if (status === 'speaking') h = 30 + (Math.random() * 20); // Fake waveform for speaking

              return (
                <div 
                    key={i}
                    className={`w-2 rounded-full transition-all duration-75 ${status === 'listening' || status === 'speaking' ? 'bg-metal-500' : 'bg-zinc-700'}`}
                    style={{ 
                        height: `${Math.max(6, h)}px`,
                        opacity: status === 'listening' || status === 'speaking' ? 1 : 0.3
                    }}
                />
              );
           })}
        </div>

        <div className="mt-8 flex justify-center">
            <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border ${status !== 'connecting' ? "border-emerald-900/50 bg-emerald-900/10 text-emerald-400" : "border-zinc-800 bg-zinc-900 text-zinc-500"}`}>
                <div className={`w-2 h-2 rounded-full ${status !== 'connecting' ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                {status !== 'connecting' ? "Conectado ao Gemini Live" : "Estabelecendo conexão..."}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;