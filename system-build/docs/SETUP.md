# SCOTTBERTRAND.COM — System Build Setup Guide

## Overview

This document provides complete setup instructions for the scottbertrand.com system, including:
- Internal dashboard (dashboard.scottbertrand.com)
- Client portal (clients.scottbertrand.com)
- Public marketing site (scottbertrand.com)

## Prerequisites

- Node.js 20+
- PostgreSQL database (Vercel Postgres recommended)
- Vercel account
- Resend account (for transactional email)
- Wix Domains access (for DNS management)

---

## 1. Environment Variables

### Required for Vercel

Add these in Vercel Project Settings → Environment Variables:

```bash
# Database (Vercel Postgres)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth.js
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="https://scottbertrand.com"

# Resend (Email)
RESEND_API_KEY="re_..."

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# File Signing Secret (for download URLs)
FILE_SIGNING_SECRET="<generate with: openssl rand -base64 32>"

# Notion (for Field Notes)
NOTION_API_KEY="ntn_..."
NOTION_DATABASE_ID="..."

# Pushover (notifications, optional)
PUSHOVER_USER_KEY="..."
PUSHOVER_API_TOKEN="..."
```

### Local Development (.env.local)

```bash
# Copy this to .env.local and fill in values

# Database
DATABASE_URL="postgresql://localhost:5432/scottbertrand_dev"
DIRECT_URL="postgresql://localhost:5432/scottbertrand_dev"

# Auth.js
AUTH_SECRET="dev-secret-change-in-production"
AUTH_URL="http://localhost:3000"

# Resend
RESEND_API_KEY="re_..."

# Vercel Blob (for local dev, use Vercel Blob directly or mock)
BLOB_READ_WRITE_TOKEN="..."

# File signing
FILE_SIGNING_SECRET="dev-file-secret"

# Notion
NOTION_API_KEY="ntn_..."
NOTION_DATABASE_ID="..."
```

---

## 2. DNS Records (Wix Domains)

Configure these DNS records for scottbertrand.com:

### A Records (Root Domain)
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel)
TTL: 3600
```

### CNAME Records (Subdomains)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: clients
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: notes
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: goods
Value: cname.vercel-dns.com
TTL: 3600
```

### Email Authentication (CRITICAL for magic links)

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

#### DKIM Record (Get from Resend dashboard)
```
Type: TXT
Name: resend._domainkey
Value: <provided by Resend>
TTL: 3600
```

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@scottbertrand.com
TTL: 3600
```

**Note:** Start DMARC with `p=none` for monitoring, then upgrade to `p=quarantine` or `p=reject` after confirming email delivery works.

---

## 3. Vercel Project Setup

### Domain Configuration

In Vercel Dashboard → Project → Settings → Domains, add:

1. `scottbertrand.com` (Production)
2. `www.scottbertrand.com` (Redirect to root)
3. `dashboard.scottbertrand.com`
4. `clients.scottbertrand.com`
5. `notes.scottbertrand.com`
6. `goods.scottbertrand.com`

### Git Integration

Connect to GitHub repository:
- Branch: `main`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

---

## 4. Database Setup

### Create Vercel Postgres Database

1. Go to Vercel Dashboard → Storage
2. Create new Postgres database
3. Copy connection strings to environment variables

### Initialize Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or use migrations for production
npx prisma migrate deploy
```

### Seed Initial Data

Create the admin user (run once after deployment):

```bash
npx prisma db seed
```

Or manually via Prisma Studio:
```bash
npx prisma studio
```

Create a User with:
- email: `scott@scottbertrand.com`
- role: `INTERNAL_ADMIN`

---

## 5. Resend Email Setup

### Domain Verification

1. Go to Resend Dashboard → Domains
2. Add `scottbertrand.com`
3. Add the DNS records Resend provides (DKIM)
4. Verify domain

### API Key

1. Go to Resend Dashboard → API Keys
2. Create new API key
3. Add to Vercel environment variables as `RESEND_API_KEY`

---

## 6. Vercel Blob Storage

### Enable Blob Storage

1. Go to Vercel Dashboard → Storage
2. Create new Blob store
3. Copy token to `BLOB_READ_WRITE_TOKEN`

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev

# Access:
# - Public site: http://localhost:3000
# - Dashboard: http://dashboard.localhost:3000 (requires /etc/hosts entry)
# - Portal: http://clients.localhost:3000 (requires /etc/hosts entry)
```

### Local Hosts File (macOS/Linux)

Add to `/etc/hosts`:
```
127.0.0.1 dashboard.localhost
127.0.0.1 clients.localhost
```

---

## 8. Security Checklist

Before going live, verify:

- [ ] All environment variables set in Vercel
- [ ] SPF, DKIM, DMARC records configured
- [ ] Magic link expiry set to 15 minutes (default)
- [ ] Rate limiting enabled on login endpoints
- [ ] File access control working
- [ ] Preview deployments have noindex headers
- [ ] www redirects to non-www
- [ ] HTTPS enforced everywhere

---

## 9. Monitoring & Maintenance

### Database Backups

Vercel Postgres includes automatic backups. For additional safety:
```bash
# Export data
npx prisma db pull
```

### Logs

Access logs via Vercel Dashboard → Deployments → Functions

### Health Checks

- `/api/health` - Basic health endpoint (create if needed)
- Vercel Status: https://status.vercel.com

---

## Support

For issues:
1. Check Vercel deployment logs
2. Review environment variables
3. Verify DNS propagation: https://dnschecker.org

---

*Last updated: January 2026*
