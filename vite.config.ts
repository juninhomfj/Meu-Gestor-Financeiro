import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Altere 'meu-gestor-financeiro' para o nome exato do seu repositório no GitHub
  // Se for fazer deploy na Vercel ou Netlify, remova esta linha 'base' ou deixe como '/'
  base: '/meu-gestor-financeiro/',
  server: {
    port: 3000,
  }
})