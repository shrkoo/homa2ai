import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone Homa build: do not load the Base44 platform plugin.
// The remaining legacy SDK calls are being migrated separately.
export default defineConfig({
  plugins: [react()],
});
