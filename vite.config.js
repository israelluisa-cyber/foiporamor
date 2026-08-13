import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Libera hosts de túnel (.loca.lt / .trycloudflare.com), usados pra
    // testar em celular fora da rede local — sem isso o Vite bloqueia o
    // Host header por segurança (proteção contra DNS rebinding) mesmo com
    // o túnel de pé.
    allowedHosts: ['.loca.lt', '.trycloudflare.com'],
  },
})
