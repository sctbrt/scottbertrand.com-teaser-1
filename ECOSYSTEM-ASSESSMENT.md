# Scott Bertrand Ecosystem — Comprehensive Assessment

**Assessment Date:** February 2, 2026
**Assessor:** Claude Code
**Scope:** Full ecosystem revision and optimization analysis

---

## Executive Summary

The Scott Bertrand digital ecosystem is a well-architected multi-property system with sophisticated design philosophy, solid security practices, and production-ready infrastructure. However, it has accumulated technical debt through rapid iteration and would benefit from consolidation and optimization.

**Ecosystem Health Score: 7.5/10**

| Area | Score | Notes |
|------|-------|-------|
| Design System | 8/10 | Strong philosophy, fragmented implementation |
| Code Quality | 7/10 | Good patterns, needs extraction from HTML |
| Security | 9/10 | Excellent headers, auth, rate limiting |
| Performance | 6/10 | Large inline styles/scripts, opportunities for optimization |
| Maintainability | 6/10 | Three separate token systems, duplication |
| Documentation | 9/10 | CLAUDE.md is comprehensive and well-maintained |

---

## Property-by-Property Analysis

### 1. scottbertrand.com (Hub Site)

**Stack:** Vite 7.3.1 + Vanilla JS
**Build:** `npm run build` → /dist
**LOC:** index.html = 1,518 lines (1,140 CSS + 270 JS inline)

#### Strengths
- Cinematic intro sequence is well-crafted with proper animation sequencing
- Time-based theme system (Canada/Eastern) is elegant
- Glass material system is sophisticated with proper fallbacks
- Mobile menu has proper focus trap and escape handling
- Respects `prefers-reduced-motion` throughout
- Skip link for accessibility

#### Issues Identified

**Critical:**
1. **Monolithic index.html** — 1,518 lines with inline styles and scripts
   - CSS: 1,140 lines embedded in `<style>` tag
   - JS: ~270 lines embedded in `<script>` tag
   - Impact: No caching benefit, harder to maintain, slower initial parse

2. **Token System Mismatch** — Three different token files exist:
   - `src/styles/tokens.css` (dark-only, #1C1C1E base)
   - `index.html` inline (light/dark, #F8F6F3/#0F0E0D)
   - These define different values for same variables

**Medium:**
3. **Unused CSS/JS Files** — `src/styles/` and `src/scripts/` contain files not used by index.html
   - `theme.js` has ThemeManager, MenuManager, ActiveNavManager classes
   - But index.html has its own implementations inline

4. **Font Loading** — Google Fonts loaded without `font-display: swap`
   - Current: No explicit display setting
   - Risk: Flash of invisible text (FOIT)

5. **Image Optimization** — Assets include PNG files that could be smaller
   - `scott-bertrand-wordmark-light.png` loaded with `?v=4` cache busting
   - Could use modern formats (WebP/AVIF)

**Low:**
6. **Schema.org Markup** — Good but could add `BreadcrumbList` for subpages
7. **Header Logo** — Uses `.sb-monogram` class with CSS filters for dark/light handling (works but fragile)

---

### 2. bertrandbrands.com (Design Studio)

**Stack:** Static HTML (no build)
**Deployment:** Vercel, outputDirectory: `src/`
**LOC:** index.html = 1,511 lines, main.css = 5,165 lines

#### Strengths
- Comprehensive design token system (`tokens.css` v5.0.0)
- Service-specific theming (Exploratory=blue, Focus Studio=violet, Core=amber)
- Pricing gate with magic link authentication (secure implementation)
- Strong CSP and security headers
- Mobile menu with focus trap
- Extensive routing configuration via vercel.json (66 rewrites/redirects)

#### Issues Identified

**Critical:**
1. **Launch Gate Still Active** — Countdown timer targets Feb 4, 2026
   - Needs removal or date update post-launch
   - `?skip` param exists but not documented publicly

2. **Large CSS Bundle** — main.css is 5,165 lines in a single file
   - Contains: reset, layout, header, intro, hero, services, forms, modals, footer, responsive
   - No code splitting or critical CSS extraction

3. **Typography Inversion** — Intentionally different from hub but not documented well
   - Hub: Fraunces (display) + Inter (body)
   - BB: Inter (display) + Fraunces (body)
   - Can cause confusion during maintenance

**Medium:**
4. **Inline Scripts** — ~2,000+ lines of JS in index.html
   - Launch gate logic, intro animation, cursor glow, scroll reveal, mobile menu, pricing modal
   - Should be extracted to separate files

5. **API Duplication** — Pricing gate APIs exist in two places:
   - `api/pricing/` (serverless functions)
   - `system-build/src/app/api/pricing/` (Next.js routes)
   - Need clarification on which is canonical

6. **Session Cleanup** — No automatic cleanup of expired `pricing_magic_links` and `pricing_sessions`
   - Could accumulate stale records over time

**Low:**
7. **Formspree Dependency** — Single point of failure for lead capture
8. **Header Component** — `components/header.js` exists but not used on all pages

---

### 3. system-build (Internal Systems)

**Stack:** Next.js 16.1.4 + React 19 + Prisma 6.19 + TypeScript
**Database:** Vercel Postgres
**Auth:** Auth.js 5.0.0-beta.30 + Resend
**Domains:** dashboard.bertrandbrands.com, clients.bertrandbrands.com

#### Strengths
- Comprehensive Prisma schema (517 lines, 25+ models)
- Role-based access control (INTERNAL_ADMIN, CLIENT)
- Payment integration with Stripe webhooks and idempotency
- Watermarking system for deliverables
- Audit logging for security events
- Rate limiting with Upstash Redis

#### Issues Identified

**Critical:**
1. **Auth.js Beta** — Using `next-auth@5.0.0-beta.30`
   - Beta software in production
   - Should monitor for stable release

2. **Missing Middleware** — No explicit `src/middleware.ts` file
   - Host-based routing may be at Vercel level only
   - Could be more explicit in codebase

**Medium:**
3. **Token System Duplication** — Third copy of tokens:
   - `src/app/tokens.css` (506 lines, different from hub and BB)
   - Different base colors (#F7F6F3 light, #1C1C1E dark)
   - Should be unified across ecosystem

4. **Payment UI Gap** — No admin UI for creating/attaching Stripe Payment Links
   - Must be done manually in Stripe dashboard
   - Feature gap for solo operator workflow

5. **Dual Route Pattern** — Both exist:
   - `/portal/projects/[id]` (legacy)
   - `/p/[publicId]` (canonical)
   - Legacy routes should redirect to canonical

6. **Bundle Size** — Heavy dependencies:
   - pdf-lib (1.17.1) — Could be lazy-loaded
   - sharp (0.34.5) — API-only usage, should be server-only

**Low:**
7. **Search Missing** — No full-text search on leads/projects
8. **Test Coverage** — No test files observed

---

## Cross-Ecosystem Analysis

### Token System Fragmentation

The ecosystem has **five different token definitions**:

| File | Location | Light BG | Dark BG | Accent |
|------|----------|----------|---------|--------|
| index.html inline | scottbertrand.com | #F8F6F3 | #0F0E0D | #B54A1A / #E07A3A |
| tokens.css | scottbertrand.com/src/styles | N/A | #1C1C1E | #F59E0B |
| tokens.css | bertrandbrands.com/src/styles | #fafaf8 | #0a0a0a | #D97706 |
| tokens.css | system-build/src/app | #F7F6F3 | #1C1C1E | #D97706 |
| glass.css | scottbertrand.com/src/styles | Custom | Custom | N/A |

**Recommendation:** Create canonical `@sb/tokens` package with shared values.

### Typography Mapping

| Property | Display Font | Body Font |
|----------|-------------|-----------|
| scottbertrand.com | Fraunces | Inter |
| bertrandbrands.com | Inter | Fraunces |
| system-build | System Sans | Source Serif 4 |

**Note:** BB's inversion is intentional per CLAUDE.md v4.0.5.

### Shared Dependencies

| Dependency | SB Hub | BB | System |
|------------|--------|----|----- --|
| @notionhq/client | ✓ 5.7.0 | ✗ | ✓ 5.8.0 |
| resend | ✗ | ✓ 4.0.0 | ✓ 6.8.0 |
| sharp | ✓ 0.34.5 | ✗ | ✓ 0.34.5 |
| @vercel/postgres | ✗ | ✓ 0.10.0 | ✗ |
| stripe | ✗ | ✗ | ✓ 17.5.0 |

**Issue:** Resend version mismatch (4.0.0 vs 6.8.0).

---

## Technical Debt Inventory

### Priority 1 (High Impact, High Urgency)

| ID | Issue | Property | Effort | Impact |
|----|-------|----------|--------|--------|
| TD-01 | Extract inline CSS from index.html | scottbertrand.com | Medium | High |
| TD-02 | Extract inline JS from index.html | scottbertrand.com | Medium | High |
| TD-03 | Remove/update launch gate | bertrandbrands.com | Low | Critical |
| TD-04 | Unify token system | All | High | High |
| TD-05 | Auth.js beta → stable | system-build | Low | Medium |

### Priority 2 (Medium Impact)

| ID | Issue | Property | Effort | Impact |
|----|-------|----------|--------|--------|
| TD-06 | Split main.css into modules | bertrandbrands.com | Medium | Medium |
| TD-07 | Add pricing session cleanup cron | bertrandbrands.com | Low | Medium |
| TD-08 | Clarify API canonical locations | bertrandbrands.com | Low | Medium |
| TD-09 | Redirect legacy portal routes | system-build | Low | Low |
| TD-10 | Add font-display: swap | scottbertrand.com | Low | Low |

### Priority 3 (Future Optimization)

| ID | Issue | Property | Effort | Impact |
|----|-------|----------|--------|--------|
| TD-11 | Monorepo migration (V5) | All | Very High | Very High |
| TD-12 | Lazy-load pdf-lib | system-build | Low | Low |
| TD-13 | Add full-text search | system-build | High | Medium |
| TD-14 | Convert PNG → WebP/AVIF | All | Medium | Medium |
| TD-15 | Add test coverage | system-build | High | Medium |

---

## Optimization Opportunities

### Quick Wins (< 1 hour each)

1. **Remove launch gate from bertrandbrands.com**
   - Delete launch gate HTML/CSS/JS
   - Remove countdown timer logic
   - ~50 lines of code

2. **Add font-display: swap to Google Fonts**
   - One-line change in HTML `<link>` tag
   - Improves perceived performance

3. **Update Auth.js when stable**
   - Wait for v5.0.0 stable release
   - `npm update next-auth`

4. **Add explicit redirects for legacy portal routes**
   - Add to vercel.json or Next.js config
   - `/portal/projects/:id` → `/p/:publicId`

### Medium Effort (1-4 hours each)

5. **Extract scottbertrand.com inline CSS**
   - Move 1,140 lines from `<style>` to external file
   - Add to Vite build pipeline
   - Enables browser caching

6. **Extract scottbertrand.com inline JS**
   - Move ~270 lines to `src/scripts/main.js`
   - Module bundling via Vite
   - Better debugging

7. **Create shared tokens package**
   - New `packages/tokens/` directory
   - Export CSS custom properties
   - Import in each property

8. **Split bertrandbrands.com CSS**
   - base.css (reset, typography)
   - layout.css (header, footer, containers)
   - components.css (cards, modals, forms)
   - animations.css (intro, hover effects)
   - responsive.css (media queries)

### Large Effort (4+ hours)

9. **Monorepo Migration (V5)**
   - Turborepo setup
   - Shared packages (@sb/tokens, @sb/glass, @sb/ui)
   - Coordinated builds
   - This is already drafted in V5_ARCHITECTURE_PLAN.md

10. **Admin UI for Payment Links**
    - CRUD interface for Stripe Payment Link URLs
    - Attach to projects/invoices
    - View payment event history

---

## Security Assessment

### Strengths

- **Headers:** All properties have comprehensive security headers
  - CSP (Content-Security-Policy)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - Strict-Transport-Security with includeSubDomains
  - Permissions-Policy restricting camera/microphone/geolocation

- **Authentication:**
  - Magic link auth (no passwords to compromise)
  - HttpOnly + Secure cookies
  - Session expiry (30 days max)
  - Rate limiting on auth endpoints

- **Payment:**
  - Stripe webhook signature verification
  - Idempotency via event ID tracking
  - Payment events logged to audit table

- **Data Protection:**
  - Lead email/phone/message encrypted at rest
  - No sensitive data in URLs

### Recommendations

1. **Add CSRF protection** — Verify all mutations use server actions (already partially done)
2. **Implement audit log retention** — Auto-delete logs older than 90 days
3. **Add encryption key rotation mechanism** — Currently no versioning
4. **Consider WAF** — Cloudflare or Vercel Edge for additional protection

---

## Performance Assessment

### Current State

| Property | First Contentful Paint | Largest Contentful Paint | Notes |
|----------|----------------------|-------------------------|-------|
| scottbertrand.com | ~1.2s (est) | ~2.5s (est) | Intro overlay delays LCP |
| bertrandbrands.com | ~1.5s (est) | ~3.0s (est) | Launch gate + intro |
| dashboard | ~0.8s (est) | ~1.5s (est) | Next.js optimized |

*Estimates based on code analysis; recommend Lighthouse audit for actual values.*

### Optimization Targets

1. **Critical CSS Extraction** — Inline above-fold CSS, defer rest
2. **Image Optimization** — Convert to WebP, add srcset for responsive
3. **Font Subsetting** — Only load characters actually used
4. **Lazy Loading** — Defer non-critical JS modules
5. **Preconnect** — Add preconnect hints for third-party domains

---

## Recommended Action Plan

### Phase 1: Immediate (This Week)

1. ✅ Remove/update launch gate on bertrandbrands.com
2. Add `font-display: swap` to Google Fonts
3. Document API canonical locations (BB vs system-build)

### Phase 2: Short-Term (This Month)

4. Extract scottbertrand.com inline CSS/JS
5. Split bertrandbrands.com main.css into modules
6. Add pricing session cleanup (manual script or cron)
7. Update Auth.js when stable release available

### Phase 3: Medium-Term (Next Quarter)

8. Create shared tokens package
9. Implement monorepo structure (V5)
10. Add admin UI for payment link management
11. Convert images to modern formats

### Phase 4: Long-Term (Future)

12. Add full-text search to dashboard
13. Implement test coverage
14. Consider Cloudflare/WAF integration
15. Evaluate headless CMS for Field Notes

---

## Appendix: File Counts

| Property | HTML | CSS | JS | Total Lines |
|----------|------|-----|-----|-------------|
| scottbertrand.com/src | 6 | 5 | 6 | ~4,000 |
| bertrandbrands.com/src | 19 | 2 | 3 | ~28,000 |
| system-build/src | 50+ | 3 | 30+ | ~15,000 |

---

*Assessment complete. This document should be reviewed quarterly and updated as changes are made.*
