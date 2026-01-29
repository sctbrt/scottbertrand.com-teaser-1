# Payments v1 — Internal Rules & Architecture

This document defines the payment system rules for the Feb 3, 2026 launch.

---

## 1. Core Principles

### 1.1 What "Paid" Means

A project is considered **paid** when:
- `project.paymentStatus === 'PAID'`

OR (fallback for legacy/manual invoices):
- Any linked invoice has `status === 'PAID'`

**Source of truth priority:**
1. Explicit `project.paymentStatus` field
2. Fallback check on invoice statuses

### 1.2 Payment Triggers "Paid" State

The canonical trigger for marking a project paid is:
- **Stripe webhook event: `checkout.session.completed`**

When this event is received with valid `project_public_id` metadata:
1. Locate project by `publicId`
2. Set `project.paymentStatus = 'PAID'`
3. Set `project.paidAt = now()`
4. Store `project.lastPaymentEventId` for idempotency
5. Optionally update linked invoice status to `PAID`

### 1.3 What Gets Gated

When `paymentStatus !== 'PAID'`:
- ❌ Deliverables cannot be released
- ❌ Client cannot approve/sign-off
- ❌ Download links are disabled (preview only)
- ✅ Client can view project details
- ✅ Client can view deliverable previews (watermarked)
- ✅ Client can submit feedback

---

## 2. Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        PAYMENT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Admin creates Payment Link in Stripe dashboard              │
│     - Sets amount, description                                  │
│     - Adds metadata: project_public_id, environment             │
│                                                                 │
│  2. Admin attaches Payment Link to project                      │
│     - Stores URL in project.stripePaymentLinkUrl                │
│     - Stores ID in project.stripePaymentLinkId                  │
│                                                                 │
│  3. Client sees "Pay Now" CTA in portal                         │
│     - Visible when project.paymentStatus === 'UNPAID'           │
│     - Links to Stripe hosted checkout                           │
│                                                                 │
│  4. Client completes payment on Stripe                          │
│     - Enters card details                                       │
│     - Stripe processes payment                                  │
│     - Shows confirmation page                                   │
│                                                                 │
│  5. Stripe sends webhook: checkout.session.completed            │
│     - Contains session metadata                                 │
│     - Includes amount_total, customer_email                     │
│                                                                 │
│  6. Webhook handler processes event                             │
│     - Verifies signature                                        │
│     - Extracts project_public_id from metadata                  │
│     - Checks idempotency (event already processed?)             │
│     - Updates project.paymentStatus to 'PAID'                   │
│     - Logs PaymentEvent for audit                               │
│                                                                 │
│  7. Client portal immediately reflects paid status              │
│     - "Paid" badge appears                                      │
│     - Release/approve actions become available                  │
│     - Download links are enabled                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Project Fields (Additions)

```prisma
model projects {
  // ... existing fields ...

  // Payment status
  paymentStatus     PaymentStatus @default(UNPAID)
  paymentProvider   PaymentProvider?
  paymentRequired   Boolean       @default(true)
  paidAt            DateTime?
  lastPaymentEventId String?      @unique

  // Stripe Payment Link
  stripePaymentLinkId  String?
  stripePaymentLinkUrl String?
  stripeCheckoutSessionId String?
  stripePaymentIntentId   String?
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

enum PaymentProvider {
  STRIPE
  MANUAL
}
```

### 3.2 PaymentEvent Model (Audit Log)

```prisma
model payment_events {
  id            String   @id @default(cuid())
  provider      PaymentProvider
  eventId       String   @unique  // Stripe event ID
  eventType     String            // checkout.session.completed
  processedAt   DateTime @default(now())
  projectId     String?
  project       projects? @relation(fields: [projectId], references: [id])
  payloadHash   String?           // SHA256 of payload for debugging
  metadata      Json?             // Relevant extracted data

  @@index([projectId])
  @@index([eventId])
}
```

---

## 4. Webhook Implementation Rules

### 4.1 Signature Verification

**Always verify webhook signatures.** Unverified requests must be rejected.

```typescript
const sig = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
```

### 4.2 Idempotency

Webhooks may be retried. Handler must be idempotent:

1. Check if `event.id` already exists in `payment_events`
2. If exists → return 200 (already processed)
3. If project already `PAID` → return 200 (no state change needed)
4. Process in transaction:
   - Create `payment_event` record
   - Update project status
5. Return 200

### 4.3 Event Types

**Required:**
- `checkout.session.completed` → Mark project paid

**Optional (logging only):**
- `checkout.session.expired` → Log, no state change
- `payment_intent.payment_failed` → Log, no state change

### 4.4 Metadata Contract

Payment Links MUST include these metadata keys:

| Key | Required | Description |
|-----|----------|-------------|
| `project_public_id` | ✅ | Project's public ID |
| `environment` | ✅ | `production` or `development` |
| `purpose` | ⚠️ | `project_payment` (for filtering) |
| `client_id` | ❌ | Internal client ID (optional) |

---

## 5. Gating Logic

### 5.1 Helper Function

```typescript
// src/lib/payment-status.ts

export function isProjectPaid(project: ProjectWithInvoices): boolean {
  // Explicit status takes precedence
  if (project.paymentStatus === 'PAID') return true

  // Fallback: check any paid invoice
  if (project.invoices?.some(inv => inv.status === 'PAID')) return true

  return false
}
```

### 5.2 Gate Enforcement Points

| Location | Check | Action if Unpaid |
|----------|-------|------------------|
| Release endpoint | `paymentStatus !== 'PAID'` | Return 400 |
| Approve button | `isProjectPaid(project)` | Hide/disable |
| Download link | `isProjectPaid(project)` | Redirect to gate |
| Sign-off form | `isProjectPaid(project)` | Show "Pay first" |

---

## 6. Admin Controls

### 6.1 Payment Link Management

Admin can:
- Attach Payment Link URL to project
- Copy Payment Link for sharing
- View payment status and history

### 6.2 Manual Override

Admin can manually mark a project as paid:
- Requires confirmation modal
- Creates audit log entry
- Sets `paymentProvider = 'MANUAL'`
- Should be rare (offline payment, wire transfer)

### 6.3 Admin UI Elements

| Element | Location | Behavior |
|---------|----------|----------|
| Payment badge | Project list/detail | Shows UNPAID/PAID/REFUNDED |
| Payment Link field | Project settings | URL input + copy button |
| Mark as Paid | Project settings | Confirmation + audit |
| Payment history | Project detail | List of payment events |

---

## 7. Client Portal UI

### 7.1 Unpaid State

When `paymentStatus === 'UNPAID'`:

```
┌─────────────────────────────────────────────┐
│  ⚠️ Payment Required                        │
│                                             │
│  Complete payment to unlock your            │
│  deliverables and finalize your project.    │
│                                             │
│  [Pay Now - $X,XXX.XX]                      │
└─────────────────────────────────────────────┘
```

- Banner appears at top of project page
- "Pay Now" links to Stripe Payment Link
- Deliverables show preview only
- Release/approve buttons hidden

### 7.2 Paid State

When `paymentStatus === 'PAID'`:

```
┌─────────────────────────────────────────────┐
│  ✓ Payment Complete                         │
│  Paid on Jan 15, 2026                       │
└─────────────────────────────────────────────┘
```

- Success badge (subtle, not obtrusive)
- All deliverables accessible
- Release/approve actions enabled

---

## 8. Edge Cases

### 8.1 Payment Fails/Expires

- **Action:** No state change
- **Client sees:** "Pay Now" CTA remains
- **Admin sees:** No notification (Stripe dashboard shows failed attempts)

### 8.2 Refund Occurs

v1 handling is manual:
1. Admin processes refund in Stripe dashboard
2. Admin sets `paymentStatus = 'REFUNDED'` via override
3. Creates audit log with reason
4. Project re-gates (client cannot release)

### 8.3 Unmatched Payment

If webhook receives payment but `project_public_id` not found:
1. Log event with warning flag
2. Send admin notification
3. Admin manually reconciles in dashboard
4. Admin can attach payment to correct project

### 8.4 Duplicate Webhooks

Handled via idempotency:
1. Check `payment_events.eventId`
2. If exists → return 200, no action
3. If project already PAID → return 200, no action

---

## 9. Security Rules

1. **Never trust client-submitted "paid" indicators**
2. **All state changes from Stripe must originate from verified webhook events**
3. **Verify webhook signatures on every request**
4. **Use parameterized queries for all database operations**
5. **Rate limit webhook endpoint (100 req/min)**
6. **Log all payment state changes for audit**

---

## 10. Environment Configuration

```env
# Required
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (for client-side if needed later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 11. Acceptance Criteria

### Definition of Done

- [ ] Unpaid project shows "Pay Now" CTA with amount
- [ ] Payment Link opens Stripe hosted checkout
- [ ] Successful payment triggers webhook
- [ ] Webhook verifies signature and is idempotent
- [ ] Project status updates to PAID automatically
- [ ] Client portal reflects paid status immediately
- [ ] Deliverables become releasable after payment
- [ ] Admin can override payment status with audit
- [ ] Unmatched payments are logged for reconciliation

---

*Document version: 1.0*
*Last updated: January 2026*
*Target launch: February 3, 2026*
