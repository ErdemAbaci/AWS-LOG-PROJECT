import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
        '/log': 'http://localhost:3000',
        '/logs': 'http://localhost:3000',
        '/cloudwatch-logs': 'http://localhost:3000'
    }
  }
})
