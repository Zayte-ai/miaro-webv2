# Maison Miaro - Production Deployment Checklist

## 🚨 CRITICAL - Must Complete Before Launch

### Security & Secrets Management
- [ ] **Remove ALL secrets from version control**
  - [ ] Verify `.env` and `.env.production` are in `.gitignore`
  - [ ] Rotate ANY secrets that were ever committed to git
  - [ ] Use deployment platform's environment variables (Vercel/Netlify/AWS)

- [ ] **Generate strong secrets**
  - [ ] JWT_SECRET: At least 32 characters (use `openssl rand -hex 32`)
  - [ ] SESSION_SECRET: At least 32 characters
  - [ ] Admin password: Hash with bcrypt, cost factor 12+

- [ ] **Update Stripe keys to production**
  - [ ] Replace `pk_test_...` with `pk_live_...`
  - [ ] Replace `sk_test_...` with `sk_live_...`
  - [ ] Create production webhook at https://dashboard.stripe.com/webhooks
  - [ ] Point webhook to: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret

### Database & Data
- [ ] **Production database setup**
  - [ ] Switch from SQLite to PostgreSQL/MySQL
  - [ ] Update `DATABASE_URL` to production database
  - [ ] Run migrations: `npm run db:migrate`
  - [ ] Test database connection
  - [ ] Set up automated backups

- [ ] **Initial data seeding**
  - [ ] Create admin account with strong password
  - [ ] Add initial product categories
  - [ ] Configure site settings (shipping rates, tax rates, etc.)
  - [ ] Test data integrity

### Authentication & Authorization
- [ ] **Test authentication flow**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Password reset email sends correctly
  - [ ] JWT tokens expire correctly
  - [ ] Admin login works
  - [ ] Admin access controls enforced

- [ ] **Rate limiting is active**
  - [ ] Test login rate limiting (should block after X attempts)
  - [ ] Test API rate limiting
  - [ ] Verify rate limits are appropriate for production traffic

### Email Configuration
- [ ] **Email service configured**
  - [ ] Choose provider (SendGrid/Resend/SMTP)
  - [ ] Add API keys to environment variables
  - [ ] Configure sender email address
  - [ ] Verify domain for sending
  - [ ] Test order confirmation emails
  - [ ] Test password reset emails
  - [ ] Check email templates render correctly
  - [ ] Verify emails don't go to spam

### Payment Processing
- [ ] **Stripe integration tested**
  - [ ] Test checkout flow end-to-end
  - [ ] Verify webhook processing works
  - [ ] Test refund processing
  - [ ] Verify order creation on successful payment
  - [ ] Test failed payment handling
  - [ ] Confirm idempotency (no duplicate orders)
  - [ ] Test currency and amount calculations

### Shipping & Fulfillment
- [ ] **FedEx API configured**
  - [ ] Production API credentials added
  - [ ] Warehouse address configured
  - [ ] Test label generation
  - [ ] Test tracking number retrieval
  - [ ] Verify shipping rate calculations

- [ ] **Shipping flow tested**
  - [ ] Shipping rates display correctly
  - [ ] Address validation works
  - [ ] Labels print correctly
  - [ ] Tracking emails send

### Environment Configuration
- [ ] **Environment variables set**
  - [ ] All required variables from `.env.example` configured
  - [ ] `NODE_ENV=production`
  - [ ] `NEXT_PUBLIC_APP_URL` set to production domain
  - [ ] `COOKIE_SECURE=true`
  - [ ] `LOG_LEVEL=info` or `error`
  - [ ] `DEBUG=false`

### Security Headers & Policies
- [ ] **Middleware configured**
  - [ ] Security headers are set (X-Frame-Options, CSP, etc.)
  - [ ] CORS configured correctly
  - [ ] HSTS enabled (Strict-Transport-Security)
  - [ ] Rate limiting active

- [ ] **SSL/HTTPS setup**
  - [ ] SSL certificate installed
  - [ ] HTTPS redirect configured
  - [ ] Test all pages load over HTTPS
  - [ ] Verify no mixed content warnings

---

## ⚠️ HIGH PRIORITY - Should Complete Before Launch

### Code Quality
- [ ] **Fix TypeScript errors**
  - [ ] Replace `any` types with proper interfaces
  - [ ] Enable `ignoreBuildErrors: false` in next.config.ts
  - [ ] Run `npm run build` with no errors

- [ ] **Fix ESLint warnings**
  - [ ] Enable ESLint during builds
  - [ ] Fix all critical ESLint errors
  - [ ] Review and fix warnings

- [ ] **Replace console.log statements**
  - [ ] Implement proper logging service (Winston/Pino)
  - [ ] Replace all `console.log` with logger
  - [ ] Replace all `console.error` with logger
  - [ ] Configure log levels appropriately

### Input Validation
- [ ] **Add validation library**
  - [ ] Install Zod or Yup
  - [ ] Create validation schemas for all API endpoints
  - [ ] Validate user inputs before processing
  - [ ] Sanitize inputs to prevent XSS/injection

- [ ] **Implement input sanitization**
  - [ ] Validate email formats
  - [ ] Validate phone numbers
  - [ ] Validate addresses
  - [ ] Validate payment amounts
  - [ ] Validate product quantities

### Error Handling
- [ ] **Implement error tracking**
  - [ ] Set up Sentry or similar service
  - [ ] Configure error reporting
  - [ ] Test error notifications
  - [ ] Set up error alerts

- [ ] **Improve error messages**
  - [ ] User-friendly error messages on frontend
  - [ ] Generic error messages in API responses
  - [ ] Detailed errors logged securely
  - [ ] No sensitive data in error responses

### Performance Optimization
- [ ] **Database optimization**
  - [ ] Add indexes on frequently queried columns
  - [ ] Optimize N+1 queries (especially in customers API)
  - [ ] Enable connection pooling
  - [ ] Test query performance under load

- [ ] **Caching strategy**
  - [ ] Set up Redis/Upstash for caching
  - [ ] Cache product listings
  - [ ] Cache categories
  - [ ] Cache site settings
  - [ ] Implement rate limiting with Redis

### Testing
- [ ] **Complete E2E testing**
  - [ ] User registration → Login → Browse → Add to cart → Checkout → Payment
  - [ ] Admin login → Add product → Edit product → View orders
  - [ ] Password reset flow
  - [ ] Email delivery
  - [ ] Webhook processing

- [ ] **Load testing**
  - [ ] Test with expected traffic volume
  - [ ] Test database under load
  - [ ] Test API response times
  - [ ] Test payment processing under load

---

## 📋 MEDIUM PRIORITY - Complete Soon After Launch

### Monitoring & Observability
- [ ] **Set up monitoring**
  - [ ] Application Performance Monitoring (APM)
  - [ ] Server resource monitoring
  - [ ] Database performance monitoring
  - [ ] Error rate monitoring
  - [ ] Uptime monitoring

- [ ] **Configure alerts**
  - [ ] High error rate alerts
  - [ ] Server down alerts
  - [ ] Database connection alerts
  - [ ] Payment processing failures
  - [ ] Email delivery failures

### Analytics
- [ ] **Google Analytics configured**
  - [ ] GA4 property created
  - [ ] Tracking ID added to environment
  - [ ] Test event tracking
  - [ ] Configure e-commerce tracking
  - [ ] Set up conversion tracking

- [ ] **Business metrics tracking**
  - [ ] Order conversion rate
  - [ ] Cart abandonment rate
  - [ ] Average order value
  - [ ] Revenue tracking
  - [ ] Product performance

### Documentation
- [ ] **API documentation**
  - [ ] Document all API endpoints
  - [ ] Add request/response examples
  - [ ] Document authentication
  - [ ] Document error codes

- [ ] **Internal documentation**
  - [ ] Deployment procedures
  - [ ] Troubleshooting guides
  - [ ] Database schema documentation
  - [ ] Environment setup guide

### DevOps
- [ ] **CI/CD pipeline**
  - [ ] Automated testing on commits
  - [ ] Automated deployment to staging
  - [ ] Manual approval for production
  - [ ] Rollback procedure documented

- [ ] **Backup strategy**
  - [ ] Automated database backups
  - [ ] Test backup restoration
  - [ ] File storage backups (if applicable)
  - [ ] Backup retention policy defined

### Compliance & Legal
- [ ] **Legal pages**
  - [ ] Privacy Policy updated
  - [ ] Terms of Service updated
  - [ ] Cookie Policy (GDPR)
  - [ ] Return/Refund Policy
  - [ ] Shipping Policy

- [ ] **GDPR compliance**
  - [ ] Cookie consent banner
  - [ ] User data export functionality
  - [ ] User data deletion functionality
  - [ ] Data retention policies

- [ ] **PCI compliance**
  - [ ] Using Stripe's PCI-compliant checkout
  - [ ] No card data stored locally
  - [ ] Security audit completed

---

## 🚀 PRE-LAUNCH FINAL CHECKS

### 24 Hours Before Launch
- [ ] Final database backup
- [ ] Test complete purchase flow
- [ ] Test admin panel
- [ ] Verify all email templates
- [ ] Check all payment webhooks
- [ ] Test mobile responsiveness
- [ ] Review error logs
- [ ] Verify SSL certificate is valid
- [ ] Test on multiple browsers
- [ ] Run security scan

### Launch Day
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test homepage loads
- [ ] Test product pages load
- [ ] Test checkout flow
- [ ] Test admin access
- [ ] Monitor error rates
- [ ] Monitor server resources
- [ ] Monitor payment processing
- [ ] Check analytics tracking

### First 48 Hours Post-Launch
- [ ] Monitor error logs continuously
- [ ] Track order completion rate
- [ ] Monitor payment success rate
- [ ] Check email delivery rates
- [ ] Monitor server performance
- [ ] Respond to customer support requests
- [ ] Fix any critical bugs immediately
- [ ] Document any issues discovered

---

## 🔧 KNOWN ISSUES TO FIX

### Critical
- [ ] **Webhook signature verification not implemented** ([api-config.ts:266-285](src/lib/api-config.ts#L266-L285))
- [ ] **Idempotency missing in webhook handler** - duplicate events could create duplicate orders
- [ ] **Email implementation incomplete** - TODOs in [email.ts](src/lib/email.ts)

### High Priority
- [ ] **N+1 query in customers API** ([customers/route.ts:80-111](src/app/api/admin/customers/route.ts#L80-L111))
- [ ] **Hardcoded shipping rates** ([create-checkout-session/route.ts:56-92](src/app/api/payments/stripe/create-checkout-session/route.ts#L56-L92))
- [ ] **Hardcoded shipping countries** ([create-checkout-session/route.ts:50](src/app/api/payments/stripe/create-checkout-session/route.ts#L50))
- [ ] **Conversion rate tracking not implemented** (returns 0)

### Medium Priority
- [ ] **Excessive `any` types in TypeScript** (20+ occurrences)
- [ ] **Console.log statements in production code** (59+ files)
- [ ] **Missing API versioning implementation**
- [ ] **Customer deletion API not implemented**

---

## 📞 SUPPORT & EMERGENCY CONTACTS

### Services & Dashboards
- **Stripe Dashboard**: https://dashboard.stripe.com/
- **FedEx Developer**: https://developer.fedex.com/
- **Email Service**: [Your provider dashboard URL]
- **Hosting Platform**: [Vercel/Netlify/AWS dashboard URL]
- **Database**: [Database management URL]

### Emergency Procedures
1. **Site is down**: Check hosting platform status, review error logs, rollback if needed
2. **Payments failing**: Check Stripe dashboard, verify webhook endpoint, check API keys
3. **Emails not sending**: Check email service dashboard, verify API keys, check quota
4. **Database connection issues**: Check connection string, verify credentials, check database server

---

## ✅ SIGN-OFF

Before deploying to production, the following people must review and approve:

- [ ] **Technical Lead**: Code review completed, all critical issues resolved
- [ ] **Security Officer**: Security audit passed, compliance verified
- [ ] **QA Team**: All tests passed, no critical bugs
- [ ] **Product Owner**: Features verified, business requirements met
- [ ] **Operations**: Infrastructure ready, monitoring configured

**Deployment Approved By**: ________________
**Date**: ________________
**Production URL**: ________________

---

## 📝 POST-LAUNCH NOTES

Use this section to document any issues encountered during or after launch:

```
[Date] - [Issue] - [Resolution]

```
