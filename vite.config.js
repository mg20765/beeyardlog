import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // tests/ holds the Playwright e2e specs, which `npm run test:e2e` runs.
    exclude: [...configDefaults.exclude, 'tests/**'],
  },
})
