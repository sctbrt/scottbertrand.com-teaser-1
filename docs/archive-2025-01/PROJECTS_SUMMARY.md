# Scott Bertrand Projects Summary

Complete overview of all three projects in the Scott Bertrand ecosystem.

## Project Structure

```
~/Sites/
├── scottbertrand.com-teaser-1/    # Main portfolio site
├── scott-field-notes/              # Field Notes subdomain
└── scott-still-goods/              # Still Goods shop subdomain
```

## 1. Main Site: scottbertrand.com-teaser-1

**Status**: ✅ Complete and deployed
**URL**: scottbertrand.com
**Port**: 8001

### What's Built:
- Homepage with hero and sections
- About, Approach, Focus, Contact pages
- Theme system (light/dark mode)
- Navigation with Field Notes and Still Goods links
- Modal system for Still Goods
- Responsive design
- Email signup form

### Key Files:
- `index.html` - Homepage
- `about.html, approach.html, focus.html, contact.html` - Content pages
- `styles.css` - Main stylesheet
- `theme.js` - Theme switching
- `modal.js` - Modal functionality
- `vercel.json` - Vercel configuration

### Navigation:
- Field Notes → `https://notes.scottbertrand.com`
- Still Goods → Opens modal → `https://goods.scottbertrand.com`

---

## 2. Field Notes: scott-field-notes

**Status**: ✅ Foundation complete, ready for deployment
**URL**: notes.scottbertrand.com (to be deployed)
**Port**: 8002

### What's Built:
- Archive page (index.html) - Lists all Field Notes entries
- Individual entry page (field-note.html)
- Notion API integration
- Theme system matching main site
- Navigation linking back to main site
- Modal system for Still Goods

### Key Files:
- `index.html` - Archive/home page
- `field-note.html` - Individual entry template
- `field-notes.css` - Field Notes specific styles
- `styles.css` - Shared base styles
- `theme.js` - Theme switching
- `modal.js` - Modal functionality
- `api/field-notes.js` - API to list all entries
- `api/field-notes/[id].js` - API for individual entries
- `vercel.json` - Vercel configuration
- `vite.config.js` - Vite configuration
- `.env.example` - Environment variables template

### Environment Variables Needed:
```env
NOTION_API_KEY=secret_your_notion_integration_token_here
NOTION_DATABASE_ID=2ed87253fff18013981fef46f830262e
```

### Next Steps:
1. Set up Notion integration (if not done)
2. Push to GitHub
3. Deploy to Vercel
4. Configure environment variables in Vercel
5. Add custom domain: notes.scottbertrand.com
6. Configure DNS CNAME record

### Development:
```bash
cd ~/Sites/scott-field-notes
npm install
npm run dev  # Runs on http://localhost:8002
```

---

## 3. Still Goods: scott-still-goods

**Status**: ✅ Foundation complete, ready for deployment
**URL**: goods.scottbertrand.com (to be deployed)
**Alias**: shop.scottbertrand.com → goods.scottbertrand.com
**Port**: 8003

### What's Built:
- Coming soon landing page
- About page with brand values
- Theme system matching main site
- Shopping cart system (localStorage-based)
- Email signup form
- Navigation structure
- Ready for product catalog

### Key Files:
- `index.html` - Shop home (coming soon)
- `about.html` - About Still Goods
- `shop.css` - Shop-specific styles
- `styles.css` - Shared base styles
- `theme.js` - Theme switching
- `shop.js` - Cart and shop functionality
- `vercel.json` - Vercel configuration
- `vite.config.js` - Vite configuration
- `.env.example` - Environment variables template

### Future Environment Variables (E-commerce):
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_SERVICE_API_KEY=...
```

### Next Steps:
1. Push to GitHub
2. Deploy to Vercel
3. Add custom domains:
   - Primary: goods.scottbertrand.com
   - Alias: shop.scottbertrand.com (redirect)
4. Configure DNS CNAME records
5. Set up shop.scottbertrand.com redirect at DNS level
6. (Future) Add product catalog
7. (Future) Integrate Stripe for payments

### Development:
```bash
cd ~/Sites/scott-still-goods
npm install
npm run dev  # Runs on http://localhost:8003
```

---

## Current Running Servers

To run all three projects simultaneously:

```bash
# Terminal 1: Main site
cd ~/Sites/scottbertrand.com-teaser-1
npm run dev  # http://localhost:8001

# Terminal 2: Field Notes
cd ~/Sites/scott-field-notes
npm run dev  # http://localhost:8002

# Terminal 3: Still Goods
cd ~/Sites/scott-still-goods
npm run dev  # http://localhost:8003
```

**Currently Running:**
- Main site: http://localhost:8001 ✅
- Field Notes: http://localhost:8002 ✅
- Still Goods: http://localhost:8003 ✅

---

## Domain Architecture

```
scottbertrand.com
├── about.html, approach.html, focus.html, contact.html
│
notes.scottbertrand.com (Field Notes)
├── Archive page (list of entries)
├── Individual entry pages
└── Links back to main site
│
goods.scottbertrand.com (Still Goods)
├── Shop home (coming soon)
├── About page
└── Links back to main site
│
shop.scottbertrand.com
└── Redirects to goods.scottbertrand.com
```

---

## DNS Configuration Required

### For Field Notes (notes.scottbertrand.com):
```
Type: CNAME
Name: notes
Value: cname.vercel-dns.com
```

### For Still Goods (goods.scottbertrand.com):
```
Type: CNAME
Name: goods
Value: cname.vercel-dns.com
```

### For Shop Alias (shop.scottbertrand.com):
```
Type: CNAME
Name: shop
Value: goods.scottbertrand.com
```

Plus redirect rule at DNS provider:
- Match: `shop.scottbertrand.com/*`
- Redirect to: `goods.scottbertrand.com/$1`
- Status: 301 (Permanent)

---

## Shared Components

All three projects share:
- Theme system (light/dark mode)
- CSS variables and design tokens
- Typography system
- Modal components
- Navigation patterns
- Brand assets (logos, monograms)

### Brand Assets Locations:
- Main site: `/assets/`
- Field Notes: `/assets/` (copied from main)
- Still Goods: `/assets/` (copied from main)

---

## Design System

**Colors:**
- Light theme: Dark text on light background
- Dark theme: Light text on dark background
- Inverse logo relationship (light logos on dark theme, dark logos on light theme)

**Typography:**
- Headings: System sans-serif
- Body: Georgia serif
- Monospace: For technical content

**Spacing:**
- Generous white space
- Consistent padding/margins
- Mobile-first responsive

---

## Deployment Checklist

### Field Notes:
- [ ] Push repository to GitHub
- [ ] Create Vercel project
- [ ] Add environment variables (Notion API)
- [ ] Deploy
- [ ] Configure custom domain
- [ ] Update DNS
- [ ] Test Notion integration

### Still Goods:
- [ ] Push repository to GitHub
- [ ] Create Vercel project
- [ ] Deploy
- [ ] Configure custom domains (goods + shop)
- [ ] Update DNS
- [ ] Set up shop redirect
- [ ] Test email signup form
- [ ] (Future) Add Stripe environment variables

---

## Development Notes

### Content:
- **Main site**: Content is finalized
- **Field Notes**: Content managed in Notion database
- **Still Goods**: Placeholder copy - GPT will fill in content

### Architecture:
- Each project is independent and deployable
- Shared assets are copied (not linked)
- Cross-linking via absolute URLs
- Theme system is consistent across all projects

### Future Enhancements:
- Field Notes: Rich text rendering, images, syntax highlighting
- Still Goods: Product catalog, shopping cart, Stripe checkout
- Main site: Blog integration, project showcase

---

## Support & Resources

**Documentation:**
- Main site: See main README.md
- Field Notes: ~/Sites/scott-field-notes/README.md
- Still Goods: ~/Sites/scott-still-goods/README.md

**Setup Guides:**
- SUBDOMAIN_SETUP.md - Field Notes deployment
- SHOP_SUBDOMAIN_SETUP.md - Still Goods deployment
- SUBDOMAINS_OVERVIEW.md - Complete architecture overview

**Contact:**
For questions or issues, contact Scott Bertrand.
