# SCOTTBERTRAND.COM — System Build v1

Secure internal operations dashboard + client portal built with Next.js 16, Auth.js, Prisma, and Vercel.

## Architecture

```
scottbertrand.com          → Public marketing site
dashboard.scottbertrand.com → Internal operations (Admin only)
clients.scottbertrand.com   → Client portal (Authenticated clients)
notes.scottbertrand.com     → Field Notes (Public)
goods.scottbertrand.com     → Still Goods (Public)
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** Auth.js v5 (Magic-link via Resend)
- **Database:** PostgreSQL (Vercel Postgres) + Prisma ORM
- **File Storage:** Vercel Blob
- **Email:** Resend
- **Deployment:** Vercel
- **DNS:** Wix Domains

## Features

### Internal Dashboard
- Lead management with intake automation
- Client profiles and project tracking
- Invoice generation (PDF)
- Service template management
- Activity audit logs

### Client Portal
- Magic-link authentication
- Project status and timeline view
- Milestone tracking
- Deliverables checklist
- Secure file downloads
- Preview link access

### Security
- Magic links expire in 15 minutes
- Single-use tokens, hashed at rest
- Rate limiting on auth endpoints
- Role-based access control
- Signed URLs for file downloads
- Separate cookie scopes per domain

## Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## Environment Setup

See [docs/SETUP.md](docs/SETUP.md) for complete setup instructions including:
- Environment variables
- DNS configuration
- Email authentication (SPF/DKIM/DMARC)
- Database initialization

## Deployment

Push to `main` branch. Vercel handles:
- Build and deployment
- Preview deployments for PRs
- SSL certificates
- Edge caching

## License

Private — Scott Bertrand
