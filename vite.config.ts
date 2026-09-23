import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // Allow tunneled/dev hosts (ngrok, custom domains) — Vite blocks unknown
    // Host headers by default (DNS-rebinding protection) with a 403.
    allowedHosts: true,
  },
})
