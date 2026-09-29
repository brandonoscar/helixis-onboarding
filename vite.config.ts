import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // The SSR bundle (src/entry-server.tsx) only renders HTML at build time;
    // it needs none of public/ (which holds the 9 MB walkthrough video).
    copyPublicDir: !isSsrBuild,
  },
}))
