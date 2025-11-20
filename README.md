# 🏦 Meu Gestor Financeiro

> Sistema de gestão financeira inteligente, focado na separação de contas PF (Pessoa Física) e PJ (Pessoa Jurídica), com distribuição automática de lucros e assistência por Inteligência Artificial.

![Status](https://img.shields.io/badge/Status-Public-0ea5e9?style=for-the-badge)
![Tech](https://img.shields.io/badge/Tech-React%20+%20Vite-zinc?style=for-the-badge)

## 📖 Sobre o Projeto

O **Meu Gestor Financeiro** é uma aplicação web progressiva (PWA) desenvolvida para autônomos, freelancers e pequenos empresários que precisam organizar suas finanças mistas. O sistema atua como um "CFO Virtual", guiando o usuário desde a entrada bruta da receita, passando pela dedução de impostos, até a distribuição estratégica para contas pessoais e de reserva.

O diferencial do projeto é a integração nativa com **Inteligência Artificial (Gemini Live)**, permitindo lançamentos e consultas via comando de voz em tempo real, totalmente gratuito utilizando a chave de API do próprio usuário.

## 🚀 Funcionalidades Principais

### 1. Gestão de Receitas (Conta Master)
- Cadastro de entradas brutas.
- Configuração de **Despesas Recorrentes** (Impostos, Taxas) que são deduzidas automaticamente (Valor Fixo ou %).
- Cálculo automático do Valor Líquido disponível para distribuição.

### 2. Distribuição Inteligente
- Ferramenta de "Split" financeiro.
- Regra sugerida: **30% PJ / 60% PF / 10% Premiação**.
- Ajuste manual via sliders intuitivos com validação de 100%.

### 3. Dashboard & Analytics
- Visão geral de saldos acumulados (PJ, PF, Bônus).
- Gráficos de barras para Entradas vs Saídas.
- Cards interativos com gradientes visuais.
- Resumo em Áudio (TTS).

### 4. Transações Avançadas
- Filtros por Data, Conta, Categoria e Status.
- Busca em tempo real por título ou descrição.
- Lançamentos recorrentes (Mensal, Semanal, Anual).
- Anexos e leitura de recibos por IA.

### 5. 🎙️ Assistente de Voz (IA)
- Integração com **Google Gemini Live API**.
- Comandos naturais: *"Adicione um almoço de 50 reais na conta PF"*.
- Visualizador de áudio em tempo real e feedback por voz.
- **Zero Custo:** Usuário insere sua própria chave de API gratuita.

## 🛠️ Tecnologias Utilizadas

*   **Front-end:** React 19 (TypeScript)
*   **Build Tool:** Vite
*   **Estilização:** Tailwind CSS (Tema Customizado *Dark Metallic*)
*   **Ícones:** Lucide React
*   **Gráficos:** Recharts
*   **IA & Voz:** Google GenAI SDK (`@google/genai`) - Gemini 2.5 Flash / Live API
*   **CI/CD:** GitHub Actions (Deploy automático)

## 📦 Passo a Passo para Publicar Gratuitamente (GitHub Pages)

Siga estas etapas para colocar seu aplicativo no ar gratuitamente.

### 1. Preparação do Repositório
1. Crie um novo repositório no GitHub (ex: `meu-gestor-financeiro`).
2. No seu computador, inicialize o git na pasta do projeto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Conecte ao repositório remoto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/meu-gestor-financeiro.git
   ```

### 2. Configuração do Vite
Certifique-se de que o arquivo `vite.config.ts` tem a propriedade `base` configurada com o nome do seu repositório:
```ts
// vite.config.ts
export default defineConfig({
  // ...
  base: '/meu-gestor-financeiro/', // Nome exato do repo entre barras
})
```

### 3. Deploy Automático
1. Envie o código para o GitHub:
   ```bash
   git push -u origin main
   ```
2. Vá até a página do seu repositório no GitHub.
3. Clique em **Settings** (Configurações).
4. No menu lateral esquerdo, clique em **Pages**.
5. Em **Source**, selecione **GitHub Actions**.
6. O GitHub detectará automaticamente o arquivo `.github/workflows/deploy.yml` já incluso no projeto e iniciará o deploy.

### 4. Acessando o App
1. Clique na aba **Actions** do repositório para acompanhar o progresso.
2. Quando ficar verde, volte em **Settings > Pages**.
3. O link do seu site estará lá (ex: `https://seu-usuario.github.io/meu-gestor-financeiro/`).

### 5. Configurando a IA (Pós-Deploy)
1. Acesse o site publicado.
2. Vá em **Configurações > Módulos & IA**.
3. Cole sua chave de API gratuita do Google AI Studio (obtenha em [aistudio.google.com](https://aistudio.google.com)).
4. Ative os módulos de IA e Voz.

---
*Desenvolvido com ❤️ e ☕ por Hypelab.*