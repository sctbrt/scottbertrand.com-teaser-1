# Stripe Setup Guide

This document covers the human steps required to configure Stripe for Bertrand Brands payment integration.

---

## 1. Account Setup

### 1.1 Create/Verify Stripe Account

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign in or create a new account
3. Verify your business information:
   - Business type: Sole proprietor / Individual
   - Country: Canada
   - Business address and banking details

### 1.2 Complete Account Verification

1. Navigate to **Settings → Business settings**
2. Complete identity verification
3. Add payout bank account (Canadian bank)
4. Ensure account status shows "Active"

---

## 2. Branding Configuration

### 2.1 Checkout Branding

1. Go to **Settings → Branding**
2. Configure the following:
   - **Icon**: Upload Bertrand Brands logo (square, 128x128px minimum)
   - **Logo**: Upload wordmark (recommended 512px wide)
   - **Brand color**: `#D97706` (Amber 600)
   - **Accent color**: `#B45309` (Amber 700)

### 2.2 Customer Portal Branding (Optional)

1. Go to **Settings → Billing → Customer portal**
2. Apply same branding as checkout
3. Enable portal features as needed (v1: disabled)

### 2.3 Email Receipts

1. Go to **Settings → Emails**
2. Enable "Successful payments" receipts
3. Customize reply-to address: `hello@bertrandbrands.com`

---

## 3. Payment Methods

### 3.1 Enable Payment Methods

1. Go to **Settings → Payment methods**
2. Enable the following for **Canada**:
   - ✅ Cards (Visa, Mastercard, Amex)
   - ✅ Apple Pay (automatic with cards)
   - ✅ Google Pay (automatic with cards)
   - ❌ Link (disable for v1 - adds complexity)
   - ❌ ACH/Bank transfers (disable for v1)
   - ❌ Buy now, pay later (disable for v1)

### 3.2 Card Statement Descriptor

1. Go to **Settings → Public details**
2. Set statement descriptor: `BERTRAND BRANDS` (max 22 chars)
3. Set shortened descriptor: `BERTRAND` (max 10 chars)

---

## 4. API Keys & Webhooks

### 4.1 Get API Keys

1. Go to **Developers → API keys**
2. Copy the following keys:

**Test Mode:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Live Mode (Production):**
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4.2 Create Webhook Endpoint

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://dashboard.bertrandbrands.com/api/webhooks/stripe`
   - **Description**: "Bertrand Brands Payment Webhooks"
   - **Listen to**: Events on your account
   - **API Version**: Latest (2024-12-18.acacia or newer)

4. Select events to listen to:
   - `checkout.session.completed` ✅ (required)
   - `checkout.session.expired` ✅ (optional, for logging)
   - `payment_intent.payment_failed` ✅ (optional, for logging)

5. Click **Add endpoint**
6. Copy the **Signing secret**:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4.3 Test Webhook Endpoint

For local development, use Stripe CLI:
```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret shown in terminal
```

---

## 5. Payment Links Setup

### 5.1 Create Payment Link Template

For v1, we create per-project Payment Links manually:

1. Go to **Payment Links** in dashboard
2. Click **+ New**
3. Configure:
   - **Pricing**: One-time, custom amount
   - **Product name**: "Project Payment - [Client Name]"
   - **Description**: Brief project description
   - **Collect**: Email address (required)
   - **After payment**: Show confirmation page

4. Before creating, click **Advanced options**:
   - Add metadata:
     - `project_public_id`: The project's public ID
     - `environment`: `production` or `development`
     - `purpose`: `project_payment`

5. Click **Create link**
6. Copy the URL and store in admin dashboard

### 5.2 Payment Link Best Practices

- Always include `project_public_id` in metadata
- Use descriptive product names (client will see this)
- Keep descriptions brief and professional
- Amount should match invoice total

---

## 6. Tax Configuration (v1: Simplified)

### 6.1 v1 Approach

For v1, we handle tax manually:
- Invoice amounts include any applicable tax
- No automatic Stripe Tax calculation
- Tax handling through accounting software

### 6.2 Future: Stripe Tax (v2)

If automatic tax is needed later:
1. Go to **Tax settings**
2. Enable Stripe Tax
3. Configure Canadian tax (GST/HST)
4. Update Payment Links to use automatic tax

---

## 7. Environment Variables

Add these to your `.env.local` (development) and Vercel environment:

```env
# Stripe API
STRIPE_SECRET_KEY=sk_test_...          # sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_...     # pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...        # Different for test/live
```

**Important:** Use test keys during development, live keys only in production.

---

## 8. Testing Checklist

Before going live, verify:

- [ ] Test mode payment works with card `4242 4242 4242 4242`
- [ ] Webhook receives `checkout.session.completed`
- [ ] Project payment status updates automatically
- [ ] Client portal shows "Paid" status
- [ ] Deliverables become releasable after payment
- [ ] Email receipt is sent to customer

### Test Card Numbers

| Number | Result |
|--------|--------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 3220` | 3D Secure required |

Use any future expiry date and any 3-digit CVC.

---

## 9. Go-Live Checklist

Before switching to live mode:

- [ ] Complete Stripe account verification
- [ ] Add payout bank account
- [ ] Test with real card (small amount, then refund)
- [ ] Update environment variables to live keys
- [ ] Create production webhook endpoint
- [ ] Verify webhook signing secret is correct
- [ ] Test end-to-end with real payment

---

## 10. Support & Troubleshooting

### Common Issues

**Webhook not receiving events:**
- Check endpoint URL is correct and accessible
- Verify webhook secret matches
- Check Stripe dashboard for failed delivery attempts

**Payment Link metadata missing:**
- Ensure metadata is added before creating the link
- Metadata keys must be lowercase

**Customer not seeing receipt:**
- Check email receipt settings in Stripe
- Verify customer email was collected

### Stripe Support

- Dashboard: [dashboard.stripe.com](https://dashboard.stripe.com)
- Documentation: [stripe.com/docs](https://stripe.com/docs)
- Support: [support.stripe.com](https://support.stripe.com)

---

*Last updated: January 2026*
*Version: 1.0 (Pre-launch)*
