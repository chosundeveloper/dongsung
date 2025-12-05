import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = [
  '.trycloudflare.com', // Cloudflare Tunnel
  '.loca.lt', // LocalTunnel
  'localhost',
]

const backendPort = process.env.BACK_PORT || '3001'
const ngrokFrontDomain = process.env.NGROK_FRONT_DOMAIN
if (ngrokFrontDomain) {
  // Strip protocol and paths so Vite only receives the hostname
  const normalizedHost = ngrokFrontDomain
    .replace(/https?:\/\//, '')
    .replace(/:.*/, '')
    .replace(/\/.*$/, '')
  allowedHosts.push(normalizedHost)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 허용
    port: 5173,
    strictPort: false, // 포트가 사용중이면 다른 포트 사용
    allowedHosts,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        secure: false,
      },
      '/tracker-api': {
        target: 'http://tracker25.duckdns.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/tracker-api/, '/api'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
