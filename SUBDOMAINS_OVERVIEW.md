# scottbertrand.com Subdomains Overview

This project uses multiple subdomains to organize different aspects of the Scott Bertrand brand.

## Domain Architecture

```
scottbertrand.com                    → Main portfolio/about site
├── notes.scottbertrand.com          → Field Notes (Notion-powered blog)
├── goods.scottbertrand.com          → Still Goods e-commerce (primary shop URL)
└── shop.scottbertrand.com           → Redirects to goods.scottbertrand.com
```

## 1. Main Site: scottbertrand.com

**Purpose**: Portfolio, about, approach, contact
**Repository**: `scottbertrand.com-teaser-1`
**Technology**: Static HTML/CSS with Vite
**Deployment**: Vercel

**Structure**:
- Homepage with hero and sections
- About, Approach, Focus, Contact pages
- Links to Field Notes and Still Goods subdomains
- Theme system (light/dark mode)
- Responsive navigation

## 2. Field Notes: notes.scottbertrand.com

**Purpose**: Working archive of systems, drafts, and observations
**Repository**: `scottbertrand.com-field-notes` (to be created)
**Technology**: Static HTML + Notion API
**Deployment**: Separate Vercel project

**Features**:
- Notion database integration
- Dynamic content rendering
- Archive view (list of entries)
- Individual entry pages
- Same theme system as main site

**Setup Guide**: See [SUBDOMAIN_SETUP.md](./SUBDOMAIN_SETUP.md)

**API Endpoints**:
- `/api/field-notes.js` - List all published entries
- `/api/field-notes/[id].js` - Get individual entry

**Environment Variables**:
- `NOTION_API_KEY` - Notion integration token
- `NOTION_DATABASE_ID` - Notion database ID

## 3. Still Goods Shop: goods.scottbertrand.com

**Purpose**: E-commerce for Still Goods brand
**Repository**: `still-goods-shop` (to be created)
**Technology**: Static HTML + payment integration (Stripe/Shopify/Snipcart)
**Deployment**: Separate Vercel project

**Features**:
- Product catalog
- Shopping cart
- Checkout flow
- Order processing
- Matches main site aesthetic

**Setup Guide**: See [SHOP_SUBDOMAIN_SETUP.md](./SHOP_SUBDOMAIN_SETUP.md)

**Alias**: shop.scottbertrand.com → redirects to goods.scottbertrand.com

## Navigation Flow

### From Main Site:
- **Field Notes** navigation item → https://notes.scottbertrand.com
- **Still Goods** navigation button → Opens modal → Click to visit https://goods.scottbertrand.com

### From Field Notes:
- Navigation includes link back to scottbertrand.com
- Still Goods modal available in navigation

### From Still Goods Shop:
- Navigation links back to scottbertrand.com
- Can link to Field Notes if desired

## DNS Configuration

Add these CNAME records to your DNS provider:

```
# Field Notes subdomain
Type: CNAME
Name: notes
Value: cname.vercel-dns.com

# Still Goods shop (primary)
Type: CNAME
Name: goods
Value: cname.vercel-dns.com

# Shop alias (redirect)
Type: CNAME
Name: shop
Value: goods.scottbertrand.com
```

## Local Development

Run all projects simultaneously for full testing:

```bash
# Terminal 1: Main site
cd ~/Sites/scottbertrand.com-teaser-1
npm run dev  # http://localhost:8001

# Terminal 2: Field Notes
cd ~/Sites/scottbertrand.com-field-notes
npm run dev  # http://localhost:8002

# Terminal 3: Still Goods shop
cd ~/Sites/still-goods-shop
npm run dev  # http://localhost:8003
```

## Deployment Checklist

### Main Site (scottbertrand.com):
- [x] Deploy to Vercel
- [x] Configure custom domain
- [x] Set environment variables (if any)
- [x] Test navigation to subdomains

### Field Notes (notes.scottbertrand.com):
- [ ] Create separate repository
- [ ] Copy Field Notes files
- [ ] Deploy to Vercel
- [ ] Configure Notion integration
- [ ] Add custom domain
- [ ] Test content loading

### Still Goods (goods.scottbertrand.com):
- [ ] Create separate repository
- [ ] Build shop structure
- [ ] Set up payment integration
- [ ] Deploy to Vercel
- [ ] Add custom domain
- [ ] Configure shop.scottbertrand.com redirect
- [ ] Test cart and checkout

## Future Considerations

### Field Notes:
- Could move to standalone domain: `fieldnotes.work` or similar
- Keep notes.scottbertrand.com as redirect
- More flexibility for independent branding

### Still Goods:
- Could move to standalone domain: `stillgoods.com` or similar
- Keep goods.scottbertrand.com as redirect
- Potential for independent brand growth
- May expand beyond single-person operation

### Main Site:
- Remains stable as personal portfolio
- Acts as hub connecting all projects
- Can reference new domains as they evolve

## Shared Assets

Some assets are shared across subdomains:

**Theme Assets**:
- SB monogram (light/dark)
- Scott Bertrand wordmark (light/dark)
- Favicon

**Brand Assets**:
- Field Notes lockup (for modals/headers)
- Still Goods lockup (for modals/headers)

**Strategy**: Copy necessary assets to each subdomain repository to maintain independence. Each subdomain should be deployable standalone.

## Analytics & Monitoring

Consider setting up:
- Google Analytics with separate properties for each subdomain
- Vercel Analytics for all projects
- Error monitoring (Sentry, etc.)
- Uptime monitoring

## Maintenance

**When updating shared elements** (theme system, navigation patterns):
1. Update main site first
2. Port changes to Field Notes
3. Port changes to Still Goods shop
4. Test cross-linking between sites

**When adding new projects**:
1. Create new subdomain repository
2. Copy theme system and navigation
3. Add links in main site navigation
4. Update this overview document
