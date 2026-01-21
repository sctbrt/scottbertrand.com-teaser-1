# Deployment Checklist

Quick reference for deploying Field Notes and Still Goods subdomains.

## ✅ Completed

- [x] Main site (scottbertrand.com) deployed
- [x] Field Notes repository created
- [x] Field Notes foundation built
- [x] Still Goods repository created
- [x] Still Goods foundation built
- [x] All three projects tested locally
- [x] Documentation created

## 📋 Field Notes Deployment

### Pre-Deployment
- [ ] Verify Notion integration is set up
- [ ] Get Notion API key (secret token)
- [ ] Confirm database ID: `2ed87253fff18013981fef46f830262e`
- [ ] Test API locally with `.env.local`

### GitHub
- [ ] Commit all changes to scott-field-notes repo
- [ ] Push to GitHub:
  ```bash
  cd ~/Sites/scott-field-notes
  git add .
  git commit -m "Initial Field Notes foundation"
  git push origin main
  ```

### Vercel
- [ ] Import scott-field-notes repository in Vercel
- [ ] Configure environment variables:
  - `NOTION_API_KEY` = your_secret_token
  - `NOTION_DATABASE_ID` = 2ed87253fff18013981fef46f830262e
- [ ] Deploy
- [ ] Verify deployment works

### DNS Configuration
- [ ] Add CNAME record at DNS provider:
  ```
  Type: CNAME
  Name: notes
  Value: cname.vercel-dns.com
  ```
- [ ] Wait for DNS propagation (up to 48 hours, usually minutes)
- [ ] Test: https://notes.scottbertrand.com

### Post-Deployment Testing
- [ ] Visit notes.scottbertrand.com
- [ ] Verify Field Notes entries load
- [ ] Test navigation to main site
- [ ] Test theme toggle
- [ ] Test Still Goods modal
- [ ] Test on mobile

---

## 📋 Still Goods Deployment

### Pre-Deployment
- [ ] Review content placeholders
- [ ] (Optional) Set up email service API for signup form
- [ ] Prepare brand assets

### GitHub
- [ ] Commit all changes to scott-still-goods repo
- [ ] Push to GitHub:
  ```bash
  cd ~/Sites/scott-still-goods
  git add .
  git commit -m "Initial Still Goods foundation"
  git push origin main
  ```

### Vercel
- [ ] Import scott-still-goods repository in Vercel
- [ ] Deploy (no environment variables needed for Phase 1)
- [ ] Verify deployment works

### DNS Configuration (Primary Domain)
- [ ] Add CNAME record at DNS provider:
  ```
  Type: CNAME
  Name: goods
  Value: cname.vercel-dns.com
  ```
- [ ] Wait for DNS propagation
- [ ] Test: https://goods.scottbertrand.com

### DNS Configuration (Shop Redirect)
Choose ONE option:

**Option A: DNS-Level Redirect (Recommended)**
- [ ] Add CNAME record:
  ```
  Type: CNAME
  Name: shop
  Value: goods.scottbertrand.com
  ```
- [ ] Add Page Rule/Redirect at DNS provider:
  - Match: `shop.scottbertrand.com/*`
  - Redirect to: `goods.scottbertrand.com/$1`
  - Status: 301 (Permanent)

**Option B: Vercel Alias**
- [ ] Add shop.scottbertrand.com as alias in Vercel
- [ ] Vercel handles redirect automatically

### Post-Deployment Testing
- [ ] Visit goods.scottbertrand.com
- [ ] Verify coming soon page loads
- [ ] Test email signup form
- [ ] Test navigation to About page
- [ ] Test navigation to main site
- [ ] Test theme toggle
- [ ] Visit shop.scottbertrand.com
- [ ] Verify redirect to goods.scottbertrand.com works
- [ ] Test on mobile

---

## 🔍 Cross-Site Testing

After both are deployed:

- [ ] Test Field Notes link from main site
- [ ] Test Still Goods modal link from main site
- [ ] Test back navigation from Field Notes to main site
- [ ] Test back navigation from Still Goods to main site
- [ ] Verify theme consistency across all three sites
- [ ] Test all links in mobile view
- [ ] Verify all logos display correctly

---

## 📧 Email Notifications

Optional: Set up email for successful deployments
- [ ] Configure Vercel deployment notifications
- [ ] Set up monitoring/uptime alerts

---

## 🔐 Environment Variables Reference

### Field Notes (Required):
```env
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=2ed87253fff18013981fef46f830262e
```

### Still Goods (Future - Phase 2/3):
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_SERVICE_API_KEY=...
```

---

## 🚨 Troubleshooting

**Field Notes won't load entries:**
- Check Notion API key is correct
- Verify database is shared with integration
- Check database ID matches
- Review Vercel deployment logs

**shop.scottbertrand.com not redirecting:**
- Verify DNS CNAME is configured
- Check redirect rule is active
- Clear browser cache
- Wait for DNS propagation

**Logos not displaying:**
- Check assets are deployed
- Verify image paths are correct
- Test theme.js is loading
- Check browser console for errors

**Links between sites not working:**
- Verify all sites are deployed
- Check absolute URLs are correct
- Test DNS is resolved

---

## 📱 Browser Testing

Test on:
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Edge

---

## 🎉 Launch Checklist

When ready to announce:
- [ ] All three sites deployed and tested
- [ ] All cross-links working
- [ ] Mobile experience tested
- [ ] Theme switching works on all sites
- [ ] Email signup tested (if active)
- [ ] Analytics configured (if desired)
- [ ] Social sharing tested
- [ ] Prepare launch announcement

---

## 📝 Notes

**Repository URLs:**
- Main: github.com/yourusername/scottbertrand.com-teaser-1
- Field Notes: github.com/yourusername/scott-field-notes
- Still Goods: github.com/yourusername/scott-still-goods

**Vercel Projects:**
- scottbertrand-com
- scott-field-notes
- scott-still-goods

**DNS Provider:** [Your DNS provider name]

---

## ⏭️ Next Steps After Deployment

### Field Notes:
1. Publish first Field Notes entry in Notion
2. Test entry displays correctly
3. Share Field Notes URL
4. Set up regular publishing schedule

### Still Goods:
1. Finalize copy (with GPT)
2. Plan product catalog
3. Set up Stripe account (test mode)
4. Design first products
5. Build product pages (Phase 2)
6. Launch e-commerce (Phase 3)

### Main Site:
1. Monitor traffic
2. Collect email signups
3. Refine based on feedback
4. Add new content as needed
