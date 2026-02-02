# V5.0.0 Architecture Plan — Turborepo Monorepo

**Status:** Draft for Review
**Created:** January 31, 2026
**Target:** Q1 2026

---

## 1. Final Architecture

```
scottbertrand-ecosystem/
├── apps/
│   ├── hub/                    # scottbertrand.com
│   ├── studio/                 # bertrandbrands.com
│   ├── dashboard/              # dashboard.bertrandbrands.com
│   ├── portal/                 # clients.bertrandbrands.com
│   ├── notes/                  # notes.scottbertrand.com
│   └── goods/                  # goods.scottbertrand.com
├── packages/
│   ├── tokens/                 # @sb/tokens
│   ├── glass/                  # @sb/glass
│   ├── ui/                     # @sb/ui
│   ├── db/                     # @sb/db (Prisma)
│   ├── auth/                   # @sb/auth (Auth.js)
│   └── utils/                  # @sb/utils
├── tooling/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

---

## 2. Domain Mapping (Unchanged)

| Domain | App | Purpose |
|--------|-----|---------|
| scottbertrand.com | hub | Personal hub & portfolio |
| bertrandbrands.com | studio | Design studio & services |
| dashboard.bertrandbrands.com | dashboard | Admin CRM |
| clients.bertrandbrands.com | portal | Client Delivery Room |
| notes.scottbertrand.com | notes | Blog/writing |
| goods.scottbertrand.com | goods | Digital storefront |

---

## 3. Package Specifications

### 3.1 `@sb/tokens`

Design tokens as TypeScript constants + CSS custom properties generator.

```typescript
// packages/tokens/src/colors.ts
export const colors = {
  dark: {
    bg: '#0a0a0a',
    bgElevated: '#111111',
    text: '#fafafa',
    textMuted: '#888888',
    textSubtle: '#555555',
    accent: '#D97706',
    accentHover: '#B45309',
    border: 'rgba(255, 255, 255, 0.08)',
  },
  light: {
    bg: '#fafaf8',
    bgElevated: '#ffffff',
    text: '#111111',
    textMuted: '#666666',
    textSubtle: '#999999',
    accent: '#B45309',
    accentHover: '#92400E',
    border: 'rgba(0, 0, 0, 0.08)',
  },
} as const;

// packages/tokens/src/typography.ts
export const typography = {
  fontDisplay: "'Fraunces', Georgia, serif",
  fontBody: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  scale: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  leading: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
} as const;

// packages/tokens/src/spacing.ts
export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  6: '1.5rem',
  8: '2rem',
  12: '3rem',
  16: '4rem',
  24: '6rem',
} as const;

// packages/tokens/src/motion.ts
export const motion = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  easing: {
    out: 'cubic-bezier(0.33, 1, 0.68, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// packages/tokens/src/css.ts
export function generateCSSVariables(theme: 'dark' | 'light'): string;
export function getTokensCSS(): string; // Full CSS file content
```

**Exports:**
- `colors`, `typography`, `spacing`, `motion` — TypeScript constants
- `generateCSSVariables()` — Runtime CSS generation
- `tokens.css` — Pre-built CSS file for static import

---

### 3.2 `@sb/glass`

Glass material system as CSS + React component.

```typescript
// packages/glass/src/config.ts
export const glassConfig = {
  blur: '12px',
  bg: {
    dark: 'rgba(255, 255, 255, 0.02)',
    light: 'rgba(255, 255, 255, 0.4)',
  },
  border: 'rgba(255, 255, 255, 0.06)',
  edgeHighlight: 'rgba(255, 255, 255, 0.08)',
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
} as const;

// packages/glass/src/GlassPanel.tsx
interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  edgeLit?: boolean;        // Enable edge lighting effect
  intensity?: 'subtle' | 'normal' | 'strong';
  as?: 'div' | 'section' | 'article';
}

export function GlassPanel({
  children,
  className,
  edgeLit = true,
  intensity = 'normal',
  as: Component = 'div',
}: GlassPanelProps): JSX.Element;
```

**Exports:**
- `glassConfig` — Configuration constants
- `GlassPanel` — React component
- `glass.css` — Standalone CSS for non-React apps

---

### 3.3 `@sb/ui`

Shared React component library.

```typescript
// packages/ui/src/index.ts
export { Button, type ButtonProps } from './button';
export { Card, type CardProps } from './card';
export { Input, type InputProps } from './input';
export { Textarea, type TextareaProps } from './textarea';
export { Select, type SelectProps } from './select';
export { Modal, type ModalProps } from './modal';
export { StatusPill, type StatusPillProps } from './status-pill';
export { Spinner, type SpinnerProps } from './spinner';
export { GlassPanel } from '@sb/glass'; // Re-export

// Layout components
export { Container } from './container';
export { Stack } from './stack';
export { Grid } from './grid';

// Navigation
export { NavLink } from './nav-link';
export { MobileMenu } from './mobile-menu';

// Forms
export { FormField } from './form-field';
export { FormError } from './form-error';
```

**Styling:** Tailwind CSS with `@sb/tokens` as CSS variables.

---

### 3.4 `@sb/db`

Prisma client and schema.

```typescript
// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export types
export * from '@prisma/client';
export type {
  User,
  Client,
  Project,
  Deliverable,
  Invoice,
  Lead,
  Feedback,
  AuditLog,
} from '@prisma/client';
```

**Schema location:** `packages/db/prisma/schema.prisma`

**Commands:**
```bash
pnpm --filter @sb/db db:generate   # Generate client
pnpm --filter @sb/db db:push       # Push schema
pnpm --filter @sb/db db:studio     # Open Prisma Studio
pnpm --filter @sb/db db:migrate    # Run migrations
```

---

### 3.5 `@sb/auth`

Unified Auth.js configuration.

```typescript
// packages/auth/src/index.ts
import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@sb/db';

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.RESEND_FROM_EMAIL ?? 'Bertrand Brands <hello@bertrandbrands.com>',
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify',
    error: '/login/error',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
};

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);

// Middleware helper
export { auth as middleware } from './middleware';

// Types
export type { Session, User } from 'next-auth';
export type Role = 'INTERNAL_ADMIN' | 'CLIENT';
```

**Usage in apps:**
```typescript
// apps/dashboard/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@sb/auth';
export const { GET, POST } = handlers;

// apps/dashboard/src/middleware.ts
export { middleware } from '@sb/auth';
export const config = { matcher: ['/dashboard/:path*'] };
```

---

### 3.6 `@sb/utils`

Shared utilities.

```typescript
// packages/utils/src/index.ts

// Date/time (Canada/Eastern timezone)
export function getTorontoTime(): Date;
export function getTimeOfDay(): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
export function formatDate(date: Date, format?: string): string;

// Validation
export function isValidEmail(email: string): boolean;
export function sanitizeInput(input: string): string;

// Formatting
export function formatCurrency(amount: number, currency?: string): string;
export function formatPhoneNumber(phone: string): string;
export function slugify(text: string): string;

// IDs
export function generatePublicId(): string; // URL-safe unique ID

// Rate limiting (Upstash helper)
export function createRateLimiter(config: RateLimitConfig): RateLimiter;

// Notifications (Pushover)
export async function sendPushoverNotification(message: string, title?: string): Promise<void>;
```

---

## 4. App Specifications

### 4.1 `apps/hub` (scottbertrand.com)

**Type:** Static site (Next.js with `output: 'export'`)

**Pages:**
- `/` — Home
- `/about` — About
- `/approach` — Approach/philosophy
- `/contact` — Contact
- `/field-notes` — Blog listing
- `/field-notes/[slug]` — Blog post

**Features:**
- Time-based theming (uses `@sb/utils` for timezone)
- Glass material system (uses `@sb/glass`)
- Field Notes from Notion API
- Minimal interactivity

**Special:** Cursor-responsive glass lighting (desktop only, `prefers-reduced-motion` respected).

---

### 4.2 `apps/studio` (bertrandbrands.com)

**Type:** SSR (Next.js with server components)

**Pages:**
- `/` — Home (services, process, contact)
- `/thanks` — Form confirmation
- `/focus-studio` — B Focus Studio intake
- `/services/[slug]` — Service detail pages
- `/ads/[slug]` — Campaign landing pages

**Features:**
- Contact form (direct API, Formspree backup)
- Pricing gate (magic link access)
- RGB ethereal effects (more expressive than hub)
- Service architecture (Core Services + Focus Studio)

**API Routes:**
- `POST /api/intake` — Form submission
- `POST /api/pricing/request-access` — Send magic link
- `GET /api/pricing/access` — Validate token
- `GET /api/pricing/check-access` — Check session
- `POST /api/pricing/logout` — End session

---

### 4.3 `apps/dashboard` (dashboard.bertrandbrands.com)

**Type:** SSR (Next.js with server components, protected)

**Access:** `INTERNAL_ADMIN` role only

**Pages:**
- `/` — Overview (inbox, urgent items)
- `/clients` — Client management
- `/clients/[id]` — Client detail
- `/projects` — Project list
- `/projects/[id]` — Project detail
- `/leads` — Form submissions
- `/leads/[id]` — Lead detail
- `/invoices` — Invoice management
- `/templates` — Service templates

**Features:**
- Next-action enforcement
- Payment discipline (gating)
- Deliverable versioning
- Audit logging

---

### 4.4 `apps/portal` (clients.bertrandbrands.com)

**Type:** SSR (Next.js with server components, protected)

**Access:** `CLIENT` role (scoped to own projects)

**Pages:**
- `/` — Project list (if multiple)
- `/p/[publicId]` — Delivery Room (canonical)
- `/pay/[invoiceId]` — Payment initiation

**Features:**
- Status display (stage, milestone, due date)
- Scope summary (included/excluded)
- Deliverable preview (watermarked if unpaid/unreleased)
- Feedback submission
- Sign-off/approval
- Clean download (after release)

---

### 4.5 `apps/notes` (notes.scottbertrand.com)

**Type:** Static (Next.js with `output: 'export'`) or SSG

**Pages:**
- `/` — Post listing
- `/[slug]` — Post detail
- `/tags/[tag]` — Posts by tag

**Content Source:**
- Option A: Notion API (current)
- Option B: MDX files in `apps/notes/content/`
- Option C: Database posts table

**Recommendation:** MDX files for simplicity and version control.

---

### 4.6 `apps/goods` (goods.scottbertrand.com)

**Type:** SSR (Next.js for Stripe integration)

**Pages:**
- `/` — Product listing
- `/products/[slug]` — Product detail
- `/checkout/success` — Purchase confirmation
- `/checkout/cancel` — Checkout cancelled

**Features:**
- Stripe Checkout integration
- Product catalog from database
- Digital delivery (Vercel Blob)

---

## 5. Database Schema (V5 Additions)

```prisma
// packages/db/prisma/schema.prisma

// --- Existing V4 models (unchanged) ---
// users, clients, projects, tasks, service_templates
// deliverables, feedbacks, signoffs
// invoices, payment_events
// leads, audit_logs, activity_logs
// sessions, verification_tokens, accounts
// pricing_magic_links, pricing_sessions

// --- V5 Additions ---

// Unified session scope (replaces separate pricing_sessions)
enum SessionScope {
  FULL_ACCESS
  PRICING_ONLY
  PROJECT_VIEW
}

// Content for notes app
model posts {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  content     String    @db.Text
  excerpt     String?
  coverImage  String?
  tags        String[]  @default([])
  publishedAt DateTime?
  authorId    String
  author      users     @relation(fields: [authorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([publishedAt])
  @@index([authorId])
}

// Products for goods app
model products {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  description     String?  @db.Text
  shortDesc       String?
  priceAmount     Int      // cents
  priceCurrency   String   @default("USD")
  stripeProductId String?
  stripePriceId   String?
  downloadUrl     String?  // Vercel Blob URL
  previewUrl      String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  purchases       purchases[]
}

// Purchase records
model purchases {
  id                    String   @id @default(cuid())
  productId             String
  product               products @relation(fields: [productId], references: [id])
  email                 String
  stripeSessionId       String?  @unique
  stripePaymentIntentId String?
  amount                Int
  currency              String   @default("USD")
  status                String   @default("pending") // pending, completed, refunded
  downloadCount         Int      @default(0)
  createdAt             DateTime @default(now())

  @@index([email])
  @@index([productId])
}

// Unified audit events (replaces fragmented logging)
model audit_events {
  id         String   @id @default(cuid())
  app        String   // hub, studio, dashboard, portal, notes, goods
  action     String
  entityType String?
  entityId   String?
  userId     String?
  user       users?   @relation(fields: [userId], references: [id])
  ip         String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([app, createdAt])
  @@index([userId])
  @@index([entityType, entityId])
}
```

---

## 6. Migration Plan

### Phase 1: Foundation (Days 1-2)

**Objective:** Set up Turborepo structure and core packages.

**Tasks:**
1. Create new repository `scottbertrand-ecosystem`
2. Initialize Turborepo with pnpm workspaces
3. Create `@sb/tokens` package (extract from existing CSS)
4. Create `@sb/utils` package (extract shared utilities)
5. Set up tooling configs (ESLint, TypeScript, Tailwind)

**Deliverables:**
- Working monorepo structure
- `@sb/tokens` publishing tokens as TS + CSS
- `@sb/utils` with core utilities
- CI passing

---

### Phase 2: Database & Auth (Days 3-4)

**Objective:** Centralize database and authentication.

**Tasks:**
1. Create `@sb/db` package
2. Move Prisma schema from system-build
3. Add V5 schema additions (posts, products, purchases, audit_events)
4. Create `@sb/auth` package
5. Test auth flow in isolation

**Deliverables:**
- `@sb/db` with full schema
- `@sb/auth` with Auth.js configuration
- Database migrations applied
- Auth tests passing

---

### Phase 3: Dashboard & Portal (Days 5-7)

**Objective:** Split system-build into separate apps.

**Tasks:**
1. Create `apps/dashboard` from system-build dashboard routes
2. Create `apps/portal` from system-build portal routes
3. Remove subdomain routing middleware
4. Update imports to use shared packages
5. Test both apps independently

**Deliverables:**
- `apps/dashboard` fully functional
- `apps/portal` fully functional
- No more subdomain middleware complexity
- All existing features working

---

### Phase 4: Studio (Days 8-10)

**Objective:** Migrate bertrandbrands.com to Next.js.

**Tasks:**
1. Create `apps/studio` as Next.js app
2. Convert static HTML to React components
3. Extract inline CSS to Tailwind + tokens
4. Migrate form handling to direct API routes
5. Migrate pricing gate to shared auth
6. Preserve all existing URLs/routes

**Deliverables:**
- `apps/studio` fully functional
- All forms working
- Pricing gate working
- RGB effects preserved
- No visual regression

---

### Phase 5: Hub (Days 11-12)

**Objective:** Migrate scottbertrand.com to Next.js.

**Tasks:**
1. Create `apps/hub` as Next.js app
2. Convert Vite pages to React components
3. Consolidate Field Notes logic (single implementation)
4. Implement time-based theming with `@sb/utils`
5. Implement glass-light effect as React hook
6. Configure static export

**Deliverables:**
- `apps/hub` fully functional
- Field Notes working
- Glass effects working
- Static export working
- No visual regression

---

### Phase 6: Content Apps (Days 13-14)

**Objective:** Set up notes and goods apps.

**Tasks:**
1. Create `apps/notes` with MDX support
2. Migrate existing field notes content
3. Create `apps/goods` with Stripe integration
4. Set up product catalog
5. Test purchase flow

**Deliverables:**
- `apps/notes` with content
- `apps/goods` with products
- Stripe integration working
- Digital delivery working

---

### Phase 7: UI Library & Polish (Days 15-16)

**Objective:** Finalize shared components and polish.

**Tasks:**
1. Create `@sb/ui` package
2. Extract common components from all apps
3. Create `@sb/glass` package
4. Document component usage
5. Final testing across all apps

**Deliverables:**
- `@sb/ui` with all shared components
- `@sb/glass` with glass system
- Component documentation
- All apps using shared components

---

### Phase 8: Deployment & Cutover (Days 17-18)

**Objective:** Deploy to production.

**Tasks:**
1. Set up Vercel projects for each app
2. Configure environment variables
3. Set up domain routing
4. Deploy all apps
5. Verify all functionality
6. Update DNS if needed
7. Archive old repositories

**Deliverables:**
- All apps live on production domains
- All functionality verified
- Old repos archived
- Monitoring in place

---

## 7. Vercel Configuration

### Root `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json"
}
```

### Per-App Configuration

Each app has its own `vercel.json`:

```json
// apps/hub/vercel.json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=hub",
  "outputDirectory": "out",
  "framework": "nextjs"
}

// apps/studio/vercel.json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=studio",
  "framework": "nextjs"
}

// apps/dashboard/vercel.json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=dashboard",
  "framework": "nextjs"
}

// apps/portal/vercel.json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=portal",
  "framework": "nextjs"
}
```

### Domain Configuration

| Vercel Project | Domain | Environment |
|----------------|--------|-------------|
| sb-hub | scottbertrand.com | Production |
| sb-studio | bertrandbrands.com | Production |
| sb-dashboard | dashboard.bertrandbrands.com | Production |
| sb-portal | clients.bertrandbrands.com | Production |
| sb-notes | notes.scottbertrand.com | Production |
| sb-goods | goods.scottbertrand.com | Production |

---

## 8. Environment Variables

### Shared (all apps)
```env
# Database
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# Auth
AUTH_SECRET=
AUTH_RESEND_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Notifications
PUSHOVER_USER_KEY=
PUSHOVER_API_TOKEN=
```

### Studio-specific
```env
NEXT_PUBLIC_FORMSPREE_ID=       # Backup form handler
PRICING_MAGIC_LINK_TTL_MINUTES= # Default: 15
PRICING_SESSION_HOURS=          # Default: 4
```

### Dashboard/Portal-specific
```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Hub-specific
```env
NOTION_API_KEY=
NOTION_DATABASE_ID=
```

### Goods-specific
```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 9. Testing Strategy

### Unit Tests
- `@sb/tokens` — Token value validation
- `@sb/utils` — Utility function tests
- `@sb/auth` — Auth configuration tests

### Integration Tests
- Form submission flow
- Auth flow (magic link → session)
- Payment flow (Stripe → webhook → status update)
- Deliverable upload/watermark/download

### E2E Tests (Playwright)
- Critical user journeys per app
- Cross-app navigation (if any)
- Mobile responsive checks

### Visual Regression (optional)
- Chromatic or Percy for component snapshots
- Catch unintended visual changes

---

## 10. Rollback Plan

If V5 deployment fails:

1. **Immediate:** Revert Vercel deployments to previous version
2. **DNS:** No changes needed (same domains)
3. **Database:** V5 schema is additive; V4 apps still work
4. **Recovery:** Old repositories remain archived, can be reactivated

---

## 11. Success Criteria

V5.0.0 is complete when:

- [ ] All 6 apps deployed and functional
- [ ] All existing URLs work (no 404s)
- [ ] All forms submit successfully
- [ ] Auth works across dashboard/portal
- [ ] Pricing gate works on studio
- [ ] Deliverable gating works (watermark, payment, release)
- [ ] Field Notes load on hub
- [ ] Products purchasable on goods
- [ ] No visual regression from V4
- [ ] Performance equal or better than V4
- [ ] Single codebase for all properties
- [ ] Shared design tokens in use everywhere

---

## 12. Post-Launch Improvements (V5.1+)

After V5.0.0 stabilizes:

1. **Component library documentation** — Storybook for `@sb/ui`
2. **Cross-domain auth** — Single sign-on across scottbertrand.com and bertrandbrands.com
3. **Advanced caching** — ISR for dynamic pages
4. **Analytics** — Unified analytics across all properties
5. **Search** — Full-text search across notes/goods
6. **API versioning** — Stable public API for integrations

---

## Appendix A: File Migration Map

| V4 Location | V5 Location |
|-------------|-------------|
| scottbertrand.com/src/styles/tokens.css | packages/tokens/src/tokens.css |
| scottbertrand.com/src/styles/glass.css | packages/glass/src/glass.css |
| scottbertrand.com/system-build/ | apps/dashboard/ + apps/portal/ |
| scottbertrand.com/system-build/prisma/ | packages/db/prisma/ |
| bertrandbrands.com/src/ | apps/studio/src/ |
| notes.scottbertrand.com/ | apps/notes/ |
| goods.scottbertrand.com/ | apps/goods/ |

---

## Appendix B: Command Reference

```bash
# Development
pnpm dev                        # Start all apps
pnpm dev --filter=hub           # Start hub only
pnpm dev --filter=dashboard     # Start dashboard only

# Build
pnpm build                      # Build all apps
pnpm build --filter=studio      # Build studio only

# Database
pnpm db:generate                # Generate Prisma client
pnpm db:push                    # Push schema changes
pnpm db:studio                  # Open Prisma Studio
pnpm db:migrate                 # Run migrations

# Linting
pnpm lint                       # Lint all
pnpm lint --filter=@sb/ui       # Lint UI package

# Testing
pnpm test                       # Run all tests
pnpm test --filter=hub          # Run hub tests

# Type checking
pnpm typecheck                  # Check all
```

---

**End of Plan**
