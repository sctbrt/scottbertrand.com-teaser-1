import { defineConfig } from 'vite'
import { resolve } from 'path'
import { imagetools } from 'vite-imagetools'

export default defineConfig({
  plugins: [imagetools()],
  root: 'src/pages',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
        about: resolve(__dirname, 'src/pages/about.html'),
        approach: resolve(__dirname, 'src/pages/approach.html'),
        focus: resolve(__dirname, 'src/pages/focus.html'),
        contact: resolve(__dirname, 'src/pages/contact.html'),
        fieldNotes: resolve(__dirname, 'src/pages/field-notes.html'),
        fieldNote: resolve(__dirname, 'src/pages/field-note.html'),
        // V1.2.0 pages
        howItWorks: resolve(__dirname, 'src/pages/how-it-works.html'),
        request: resolve(__dirname, 'src/pages/request.html'),
        // Service detail pages
        websiteAudit: resolve(__dirname, 'src/pages/services/website-audit.html'),
        brandAudit: resolve(__dirname, 'src/pages/services/brand-audit.html'),
        brandReset: resolve(__dirname, 'src/pages/services/brand-reset.html'),
        websiteFoundation: resolve(__dirname, 'src/pages/services/website-foundation.html'),
        fullBrandWebsiteReset: resolve(__dirname, 'src/pages/services/full-brand-website-reset.html'),
      },
    },
  },
  server: {
    port: 8000,
    open: true,
  },
})
