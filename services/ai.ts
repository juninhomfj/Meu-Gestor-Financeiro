import { GoogleGenAI, Type } from "@google/genai";
import { StorageService } from './storage';

// Helper to get the appropriate client based on key source
const getAIClient = () => {
  // 1. Try User's Custom Key from LocalStorage
  const userKey = StorageService.getApiKey();
  
  // 2. Try Environment Key (if provided in build)
  // Fix TS error by casting import.meta to any
  const envKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

  const apiKey = userKey || envKey;

  if (!apiKey) {
    throw new Error("Chave de API não encontrada. Por favor, configure sua chave Gemini em Configurações > Módulos.");
  }

  return new GoogleGenAI({ apiKey });
};

// Utilitário para converter File/Blob em Base64
const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove o prefixo 'data:image/png;base64,' para a API
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const AIService = {
  /**
   * Analisa comprovantes/notas fiscais usando Gemini 3 Pro (Vision)
   */
  analyzeReceipt: async (imageFile: File) => {
    try {
      const ai = getAIClient();
      const base64Data = await fileToBase64(imageFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageFile.type,
                data: base64Data
              }
            },
            {
              text: "Analise esta imagem de recibo ou nota fiscal. Extraia os dados para preencher uma transação financeira. Retorne APENAS um JSON com este formato: { title: string, amount: number, date: string (YYYY-MM-DD), description: string }."
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
      
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Erro ao analisar recibo:", error);
      throw error;
    }
  },

  /**
   * Consultor Financeiro com Thinking Mode (Gemini 3 Pro)
   */
  getFinancialAdvice: async (userMessage: string, context: string) => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Contexto Financeiro do Usuário: ${context}. \n\nPergunta do Usuário: ${userMessage}`,
        config: {
          thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget
          systemInstruction: "Você é um consultor financeiro experiente e cauteloso. Analise profundamente o contexto financeiro do usuário antes de responder. Forneça conselhos práticos, estratégias de investimento ou redução de dívidas."
        }
      });
      return response.text;
    } catch (error) {
      console.error("Erro no consultor:", error);
      throw error;
    }
  },

  /**
   * Sugestão Rápida de Categoria (Gemini 2.5 Flash Lite) - Baixa Latência
   */
  suggestCategory: async (title: string, categoriesList: string[]) => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest', // Modelo rápido
        contents: `Dada a lista de categorias: [${categoriesList.join(', ')}]. Qual a melhor categoria para uma transação com título "${title}"? Retorne apenas o nome da categoria exato.`,
      });
      return response.text?.trim();
    } catch (error) {
      console.error("Erro na sugestão rápida:", error);
      return null;
    }
  },

  /**
   * Transcrição de Áudio (Gemini 2.5 Flash)
   */
  transcribeAudio: async (audioBlob: Blob) => {
    try {
      const ai = getAIClient();
      const base64Data = await fileToBase64(audioBlob);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Modelo padrão para áudio
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'audio/wav', // Assumindo gravação do navegador
                data: base64Data
              }
            },
            {
              text: "Transcreva este áudio exatamente como foi falado."
            }
          ]
        }
      });
      return response.text;
    } catch (error) {
      console.error("Erro na transcrição:", error);
      throw error;
    }
  },

  /**
   * Gerar Fala (TTS) (Gemini 2.5 Flash TTS)
   */
  generateSpeech: async (text: string) => {
    try {
      const ai = getAIClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text }] },
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio; // Retorna base64 para ser tocado
    } catch (error) {
      console.error("Erro no TTS:", error);
      throw error;
    }
  }
};