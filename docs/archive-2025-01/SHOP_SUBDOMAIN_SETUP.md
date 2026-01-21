# Setting Up goods.scottbertrand.com Shop Subdomain

This guide explains how to deploy Still Goods e-commerce to goods.scottbertrand.com with shop.scottbertrand.com as an alias.

## Architecture

- **Main site**: scottbertrand.com (portfolio/about)
- **Field Notes**: notes.scottbertrand.com (Notion-powered blog)
- **Still Goods Shop**: goods.scottbertrand.com (e-commerce, primary URL)
- **Shop Alias**: shop.scottbertrand.com → redirects to goods.scottbertrand.com

## Step-by-Step Setup

### 1. Create Still Goods Repository

Create a new repository called `still-goods-shop`:

```bash
mkdir ~/Sites/still-goods-shop
cd ~/Sites/still-goods-shop
git init
```

### 2. Choose E-commerce Platform

Select one of these approaches:

#### Option A: Shopify Buy Button / Headless Shopify
- Custom frontend with Shopify backend
- Use Shopify Storefront API
- Full design control

#### Option B: Shopify with Custom Domain
- Use Shopify's hosted checkout
- Custom theme matching Still Goods aesthetic
- Redirect subdomains to Shopify store

#### Option C: Custom E-commerce (Stripe + Next.js)
- Full control over user experience
- Stripe for payments
- Custom product management

#### Option D: Static Site with Snipcart/Commerce.js
- Lightweight, static HTML/CSS
- Third-party cart/checkout
- Matches main site's minimal approach

### 3. Initial Structure (Static Approach)

For a minimal static shop matching your site's aesthetic:

```
still-goods-shop/
├── index.html              # Shop home/product grid
├── product.html            # Individual product template
├── cart.html              # Shopping cart
├── checkout.html          # Checkout flow
├── styles.css             # Shop styles (matches main site)
├── shop.js                # Cart/checkout logic
├── assets/
│   ├── products/          # Product images
│   └── brand/             # Logo assets
├── api/
│   ├── products.js        # Product catalog API
│   └── orders.js          # Order processing
├── package.json
├── vercel.json
└── .env.example
```

### 4. Create Initial Shop Files

#### index.html (Shop Home)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <title>Still Goods — Shop</title>
    <meta name="description" content="Quiet goods for considered living.">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="assets/still-goods-icon.png">

    <!-- Stylesheet -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Navigation matching main site -->
    <header class="shop-header">
        <nav class="nav-container">
            <a href="/" class="shop-brand">
                <img src="assets/still-goods-logo.png" alt="Still Goods" class="brand-logo">
            </a>

            <div class="nav-links">
                <a href="/">Shop</a>
                <a href="/about.html">About</a>
                <a href="https://scottbertrand.com">Scott Bertrand</a>
            </div>

            <button class="cart-toggle" id="cartToggle">
                Cart (<span id="cartCount">0</span>)
            </button>
        </nav>
    </header>

    <main>
        <section class="products-grid">
            <div class="container">
                <!-- Products will be loaded here -->
                <div id="productsContainer" class="products"></div>
            </div>
        </section>
    </main>

    <script type="module" src="shop.js"></script>
</body>
</html>
```

#### vercel.json (Shop Configuration)
```json
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "devCommand": "npx vite --port 8003",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/products/:slug",
      "destination": "/product.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/shop",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### 5. Set Up shop.scottbertrand.com Redirect

You have two options for the shop.scottbertrand.com → goods.scottbertrand.com redirect:

#### Option A: DNS-Level Redirect (Recommended)
Configure at your DNS provider (Cloudflare, etc.):

1. In Cloudflare/DNS provider dashboard:
   - Add CNAME record: `shop` → `goods.scottbertrand.com`
   - Enable Page Rule or Redirect Rule:
     - Match: `shop.scottbertrand.com/*`
     - Redirect to: `goods.scottbertrand.com/$1`
     - Status: 301 (Permanent)

#### Option B: Separate Vercel Project (Redirect-Only)
Create a tiny redirect project:

```bash
mkdir ~/Sites/shop-redirect
cd ~/Sites/shop-redirect
```

Create `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://goods.scottbertrand.com/$1",
      "permanent": true
    }
  ]
}
```

Deploy to Vercel and assign `shop.scottbertrand.com` domain.

### 6. Deploy to Vercel

1. Push Still Goods repository to GitHub:
```bash
cd ~/Sites/still-goods-shop
git add .
git commit -m "Initial Still Goods shop setup"
git remote add origin git@github.com:yourusername/still-goods-shop.git
git push -u origin main
```

2. In Vercel Dashboard:
   - Import `still-goods-shop` repository
   - Configure environment variables (Stripe keys, etc.)
   - Deploy

3. Set up custom domains:
   - Primary: `goods.scottbertrand.com`
   - Alias (optional): `shop.scottbertrand.com` (if not using DNS redirect)

### 7. DNS Configuration

Add these DNS records:

```
# Primary shop domain
Type: CNAME
Name: goods
Value: cname.vercel-dns.com

# Shop alias (if using Vercel for redirect)
Type: CNAME
Name: shop
Value: cname.vercel-dns.com
```

Or if using Cloudflare redirect:
```
# Primary shop domain
Type: CNAME
Name: goods
Value: cname.vercel-dns.com

# Shop alias (redirect at Cloudflare)
Type: CNAME
Name: shop
Value: goods.scottbertrand.com
```

### 8. Update Main Site Still Goods Modal

The Still Goods modal on scottbertrand.com should link to the shop:

```html
<!-- In index.html, about.html, etc. -->
<div class="modal" id="stillGoodsModal" aria-hidden="true">
    <div class="modal-overlay" data-close-modal></div>
    <div class="modal-content">
        <button class="modal-close" data-close-modal aria-label="Close">×</button>
        <a href="https://goods.scottbertrand.com" class="modal-link">
            <picture>
                <source srcset="assets/still-goods-light.avif" type="image/avif" media="(prefers-color-scheme: dark)">
                <source srcset="assets/still-goods-light.webp" type="image/webp" media="(prefers-color-scheme: dark)">
                <source srcset="assets/still-goods-dark.avif" type="image/avif" media="(prefers-color-scheme: light)">
                <source srcset="assets/still-goods-dark.webp" type="image/webp" media="(prefers-color-scheme: light)">
                <img src="assets/still-goods-light.png" alt="Still Goods" class="modal-image">
            </picture>
        </a>
        <p class="modal-caption">
            <a href="https://goods.scottbertrand.com" class="modal-caption-link">Visit Shop</a>
        </p>
    </div>
</div>
```

### 9. E-commerce Integration Options

#### Stripe Integration
```bash
npm install stripe
```

Create `.env.local`:
```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Shopify Storefront API
```bash
npm install @shopify/storefront-api-client
```

Create `.env.local`:
```
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
```

#### Snipcart (Static)
Add to HTML:
```html
<script src="https://cdn.snipcart.com/themes/v3.5.1/default/snipcart.js"></script>
<link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.5.1/default/snipcart.css" />

<div hidden id="snipcart" data-api-key="YOUR_PUBLIC_API_KEY"></div>
```

### 10. Testing Locally

Run shop development server:
```bash
cd ~/Sites/still-goods-shop
npm run dev  # Runs on port 8003
```

Test:
- Shop: http://localhost:8003
- Main site: http://localhost:8001
- Field Notes: http://localhost:8002 (if running)

### 11. Design System

Match the main site's aesthetic:

**Typography:**
- Headings: Same sans-serif as main site
- Body: Georgia serif for product descriptions
- Prices: Monospace or sans-serif, subtle

**Colors:**
- Follow main site theme system (light/dark mode)
- Neutral palette (grays, warm whites)
- Minimal accent colors

**Layout:**
- Generous white space
- Simple product grid (2-3 columns on desktop)
- Clean product detail pages
- Minimal checkout flow

**Navigation:**
- Consistent header with main site
- Quiet cart indicator
- Breadcrumbs for product navigation

### 12. Product Data Structure

Example product JSON:
```json
{
  "products": [
    {
      "id": "001",
      "slug": "linen-apron",
      "name": "Linen Work Apron",
      "price": 8500,
      "currency": "USD",
      "description": "Heavy linen, leather straps. Made to last.",
      "images": [
        "/assets/products/linen-apron-01.jpg",
        "/assets/products/linen-apron-02.jpg"
      ],
      "inStock": true,
      "variants": [
        { "size": "One Size", "sku": "LA-001-OS" }
      ],
      "category": "Workshop",
      "tags": ["linen", "workwear", "made-to-order"]
    }
  ]
}
```

### 13. Future Enhancements

- Order management dashboard
- Inventory tracking
- Email notifications (order confirmations)
- Customer accounts
- Product reviews
- Gift cards
- Newsletter integration (connect with main site email list)
- Analytics and conversion tracking

### 14. Migration to Full Domain

If you later want to move to `stillgoods.com`:

1. Update DNS to point `stillgoods.com` to Vercel
2. Add domain in Vercel project
3. Set up redirects:
   - `goods.scottbertrand.com` → `stillgoods.com`
   - `shop.scottbertrand.com` → `stillgoods.com`
4. Update links on main site
5. Configure SEO redirects (301) to preserve search rankings

## Testing Checklist

- [ ] goods.scottbertrand.com loads shop home
- [ ] shop.scottbertrand.com redirects to goods.scottbertrand.com
- [ ] Product pages load correctly
- [ ] Cart functionality works
- [ ] Checkout flow completes
- [ ] Orders are processed (test mode)
- [ ] Email confirmations send
- [ ] Mobile responsive design
- [ ] Light/dark theme switching
- [ ] Links back to main site work
- [ ] Navigation consistent with main site

## Troubleshooting

**shop.scottbertrand.com not redirecting:**
- Verify DNS CNAME is configured
- Check Cloudflare page rule is active
- Ensure redirect is set to 301 (permanent)
- Clear browser cache

**goods.scottbertrand.com returns 404:**
- Verify Vercel deployment succeeded
- Check custom domain is added in Vercel
- Verify DNS propagation (can take up to 48 hours)

**Payments not working:**
- Verify Stripe/payment API keys are set
- Check environment variables in Vercel
- Test with Stripe test cards
- Review webhook configuration

**Styles not loading:**
- Check asset paths are correct
- Verify build output includes CSS
- Check browser console for errors
