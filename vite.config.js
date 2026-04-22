import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const gitHash = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'dev'; }
})();

export default defineConfig({
  plugins: [react()],
  define: { __GIT_VERSION__: JSON.stringify(gitHash) },
  server: { port: 3000 },
  build: { outDir: 'dist', sourcemap: false },
});
