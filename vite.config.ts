import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite 설정. Tailwind v4는 tailwind.config 파일 없이 플러그인으로 동작한다.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true },
})
