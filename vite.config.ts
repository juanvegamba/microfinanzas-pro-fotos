import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // CRITICO: Base relativa asegura que los assets carguen bien en Firebase Hosting
    base: './', 
    server: {
      // Oculta la pantalla roja de errores en desarrollo (útil para warnings de Tailwind o Grammarly)
      hmr: {
        overlay: false
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            // Separa librerías pesadas para carga más rápida y evitar timeouts
            vendor: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
            ui: ['lucide-react'],
            ai: ['@google/genai']
          },
        },
      },
    },
  };
});