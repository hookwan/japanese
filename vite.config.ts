import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' is crucial for GitHub Pages. 
  // If your repo is 'https://github.com/user/repo', this should be '/repo/'.
  // For now, './' works for most simple deployments.
  base: './', 
});
