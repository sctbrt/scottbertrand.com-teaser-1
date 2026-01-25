import { defineConfig } from 'vite'
import { resolve } from 'path'
import { imagetools } from 'vite-imagetools'

export default defineConfig({
  plugins: [imagetools()],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        caseStudies: resolve(__dirname, 'case-studies.html'),
        fieldNotes: resolve(__dirname, 'field-notes.html'),
        fieldNote: resolve(__dirname, 'field-note.html'),
        // V1.5 pages
        howItWorks: resolve(__dirname, 'how-it-works.html'),
        request: resolve(__dirname, 'request.html'),
        // Service detail pages
        websiteAudit: resolve(__dirname, 'services/website-audit.html'),
        brandAudit: resolve(__dirname, 'services/brand-audit.html'),
        brandReset: resolve(__dirname, 'services/brand-reset.html'),
        websiteFoundation: resolve(__dirname, 'services/website-foundation.html'),
        fullBrandWebsiteReset: resolve(__dirname, 'services/full-brand-website-reset.html'),
      },
    },
  },
  server: {
    port: 8000,
    open: true,
  },
})
