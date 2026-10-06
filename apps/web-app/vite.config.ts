import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// En Docker, debemos usar los nombres de servicio (auth-service, etc.)
// En Local (fuera de Docker), usamos 127.0.0.1
const isDocker = process.env.IS_DOCKER === 'true';

const getTarget = (service: string, port: number) =>
  isDocker ? `http://${service}:${port}` : `http://127.0.0.1:${port}`;

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: false, // Si 5173 está ocupado, usa el siguiente disponible
    hmr: {
      // El cliente HMR usará automáticamente el host y puerto desde el que se cargó la página.
      // Esto evita ERR_CONNECTION_REFUSED cuando Vite sube de 5173 a 5174.
    },
    watch: {
      usePolling: true
    },
    proxy: {
      '/api/auth': {
        target: isDocker ? 'http://user-service:8000' : 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/groups': {
        target: isDocker ? 'http://group-service:8000' : 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/stats': {
        target: isDocker ? 'http://stats-service:8000' : 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/ocr': {
        target: isDocker ? 'http://ocr-service:8000' : 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/notifications': {
        target: isDocker ? 'http://notification-service:8000' : 'http://localhost:8005',
        changeOrigin: true,
      },
      '/api/wallet': {
        target: isDocker ? 'http://wallet-service:8000' : 'http://localhost:8006',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@easy-pay/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@services': path.resolve(__dirname, './src/services'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@domain': path.resolve(__dirname, './src/domain'),
    },
    dedupe: ['react', 'react-dom']
  }
})
