import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do sistema
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Verifica se a variável GITHUB_PAGES foi passada (pelo Workflow)
  const isGitHubPages = env.GITHUB_PAGES === 'true';

  return {
    plugins: [react()],
    // Lógica Híbrida:
    // - GitHub Pages: Usa o subdiretório do repositório
    // - Vercel / Localhost: Usa a raiz '/'
    base: isGitHubPages ? '/meu-gestor-financeiro/' : '/',
    server: {
      port: 3000,
    }
  }
})