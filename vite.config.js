import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['smartcampus-iau.com', 'www.smartcampus-iau.com'],
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
      '/tasks': 'http://localhost:8080',
      '/schedule': 'http://localhost:8080',
      '/schedule-ocr': 'http://localhost:8080',
      '/parking': 'http://localhost:8080',
      '/classrooms': 'http://localhost:8080',
      '/buildings': 'http://localhost:8080',
      '/parking-zones': 'http://localhost:8080',
    }
  }
})
