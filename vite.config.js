import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
        proxy: {
          // Proxy requests starting with '/api'
          '/pharmacy3/api/': {
            target: 'http://localhost:8080', // The target backend server
            changeOrigin: true, // Needed for virtual hosted sites
            secure: false, // Set to true if your target uses HTTPS and you want to enforce certificate validation
            // rewrite: (path) => path.replace(/^\/api/, ''), // Optional: remove the '/api' prefix before sending to target
          },
         
        },
      },
})
