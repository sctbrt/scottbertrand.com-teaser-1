# DNS Records for scottbertrand.com

Add these DNS records in Wix Domains to enable:
1. Email sending via Resend
2. Subdomain routing to the system-build Vercel deployment

---

## 1. Resend Email (DKIM/SPF) Records

These records verify your domain with Resend for sending emails from `noreply@scottbertrand.com`.

### DKIM Record (Required)
| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | `resend._domainkey` | *(Get from Resend dashboard → Domains → scottbertrand.com → DNS Records)* |

### SPF Record (Required)
| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | `@` | `v=spf1 include:_spf.resend.com ~all` |

**Note**: If you already have an SPF record, add `include:_spf.resend.com` to the existing record.

---

## 2. Subdomain Routing Records

These CNAME records point the subdomains to your Vercel deployment.

### Dashboard (Internal Admin)
| Type | Host/Name | Value |
|------|-----------|-------|
| CNAME | `dashboard` | `cname.vercel-dns.com` |

### Client Portal
| Type | Host/Name | Value |
|------|-----------|-------|
| CNAME | `clients` | `cname.vercel-dns.com` |

---

## 3. Vercel Domain Configuration

After adding the DNS records in Wix, add the domains in Vercel:

1. Go to Vercel → system-build project → Settings → Domains
2. Add: `dashboard.scottbertrand.com`
3. Add: `clients.scottbertrand.com`
4. Vercel will verify the CNAME records automatically

---

## Verification Steps

1. **Resend**: Go to Resend dashboard → Domains → scottbertrand.com → Click "Verify"
2. **Vercel**: Domains will show green checkmarks once DNS propagates (usually 1-24 hours)

---

## Current Status

- [ ] Resend DKIM record added
- [ ] Resend SPF record added/updated
- [ ] Resend domain verified
- [ ] dashboard.scottbertrand.com CNAME added
- [ ] clients.scottbertrand.com CNAME added
- [ ] Vercel domains configured
- [ ] SSL certificates issued (automatic)
