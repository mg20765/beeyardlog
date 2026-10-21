import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Tells the browser to run only this app's own files: no inline scripts, no
// other sites, no plugins. Inline styles stay allowed because React sets
// style attributes. Added to the production build only, because the dev
// server needs inline scripts for hot reload.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const contentSecurityPolicy = {
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml() {
    return [
      {
        tag: 'meta',
        attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
        injectTo: 'head-prepend',
      },
    ]
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy],
  test: {
    // tests/ holds the Playwright e2e specs, which `npm run test:e2e` runs.
    exclude: [...configDefaults.exclude, 'tests/**'],
  },
})
