import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 상대 경로로 빌드해서 GitHub Pages 하위 경로 등 어디에 올려도 동작
  base: './',
});
