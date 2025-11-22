# ¡ IMMEDIATE ACTIONS REQUIRED

**Priority**: CRITICAL
**Time to Complete**: 2-4 hours
**Must Complete Before**: Production deployment

---

## =4 STOP! Do These First

### Action 1: Verify Secrets Are Not in Git History (5 minutes)
```bash
# Run this command in your project directory:
cd "c:\Users\jonah\Desktop\VSCODE\Random\Maison Miaro\Miaro"
git log --all --full-history --source -- ".env*"
```

**If you see any output**:
-   Secrets have been committed to git
- ALL secrets must be rotated immediately
- Contact your hosting provider to rotate API keys
- See [SECURITY_ADVISORY.md](SECURITY_ADVISORY.md) for cleanup instructions

**If no output**:
-  Good! Your secrets are safe
- Proceed to Action 2

---

### Action 2: Generate Strong Secrets (10 minutes)

Run these commands to generate secure secrets:

```bash
# Generate JWT_SECRET (copy output)
openssl rand -hex 32

# Generate SESSION_SECRET (copy output)
openssl rand -hex 32
```

**Update your `.env` file** (DO NOT COMMIT THIS FILE):
```env
JWT_SECRET="<paste-generated-secret-here>"
SESSION_SECRET="<paste-generated-secret-here>"
```

**For production**, add these to your hosting platform's environment variables:
- Vercel: Project Settings ’ Environment Variables
- Netlify: Site Settings ’ Environment Variables
- AWS/Other: Your platform's secrets manager

---

### Action 3: Create Strong Admin Password (5 minutes)

```bash
# Install bcryptjs if not already installed:
npm install bcryptjs

# Create a Node script to hash your password:
node -e "const bcrypt = require('bcryptjs'); const password = 'YOUR_STRONG_PASSWORD_HERE'; const hash = bcrypt.hashSync(password, 12); console.log(hash);"
```

**Update `.env`**:
```env
ADMIN_PASSWORD_HASH="<paste-bcrypt-hash-here>"
```

**Password Requirements**:
- At least 12 characters
- Mix of uppercase, lowercase, numbers, special characters
- Not a dictionary word
- Unique to this application

---

### Action 4: Set Up Production Stripe Keys (10 minutes)

**Current**: Using test keys (`pk_test_...`, `sk_test_...`)
**Required**: Production keys

**Steps**:
1. Go to https://dashboard.stripe.com/apikeys
2. Click "Create secret key" for production
3. Copy your production keys
4. Add to production environment variables (NOT `.env` file):
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   STRIPE_SECRET_KEY="sk_live_..."
   ```

**Webhook Setup**:
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
5. Copy webhook signing secret
6. Add to environment: `STRIPE_WEBHOOK_SECRET="whsec_..."`

---

### Action 5: Configure Email Service (20-30 minutes)

Choose ONE email provider:

#### Option A: SendGrid (Recommended)
1. Sign up at https://sendgrid.com/
2. Create API key
3. Verify sender email
4. Add to `.env`:
   ```env
   SENDGRID_API_KEY="SG...."
   SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
   SENDGRID_FROM_NAME="Maison Miaro"
   ```

#### Option B: Resend (Alternative)
1. Sign up at https://resend.com/
2. Create API key
3. Add to `.env`:
   ```env
   RESEND_API_KEY="re_..."
   ```

#### Option C: SMTP
```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-password"
```

**Test Email Sending**:
```bash
# After configuration, test by triggering password reset
# Check email delivery and logs
```

---

### Action 6: Add Webhook Idempotency (30-45 minutes)

**Why**: Prevents duplicate orders if Stripe sends same webhook twice

**Add to `prisma/schema.prisma`**:
```prisma
model WebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique
  eventType   String
  processed   Boolean  @default(false)
  processedAt DateTime?
  createdAt   DateTime @default(now())
}
```

**Run migration**:
```bash
npx prisma migrate dev --name add-webhook-events
```

**Update `src/app/api/webhooks/stripe/route.ts`** - Add before processing:
```typescript
// At the top of POST function, after signature verification:
const existingEvent = await prisma.webhookEvent.findUnique({
  where: { eventId: event.id }
});

if (existingEvent) {
  console.log('Duplicate webhook event, skipping:', event.id);
  return NextResponse.json({ received: true, duplicate: true });
}

// After successful processing, before return:
await prisma.webhookEvent.create({
  data: {
    eventId: event.id,
    eventType: event.type,
    processed: true,
    processedAt: new Date(),
  },
});
```

---

### Action 7: Implement Account Lockout (30-45 minutes)

**Add to `prisma/schema.prisma`**:
```prisma
model User {
  // ... existing fields
  loginAttempts Int      @default(0)
  lockedUntil   DateTime?
}
```

**Run migration**:
```bash
npx prisma migrate dev --name add-login-attempts
```

**Update login routes** (`src/app/api/auth/login/route.ts` and `src/app/api/admin/auth/route.ts`):
```typescript
// Before password check:
if (user.lockedUntil && user.lockedUntil > new Date()) {
  return NextResponse.json(
    { error: 'Account locked. Please try again later.' },
    { status: 423 }
  );
}

// After failed password:
const newAttempts = user.loginAttempts + 1;
const lockAccount = newAttempts >= 5;

await prisma.user.update({
  where: { email },
  data: {
    loginAttempts: newAttempts,
    ...(lockAccount && {
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }),
  },
});

if (lockAccount) {
  return NextResponse.json(
    { error: 'Too many failed attempts. Account locked for 15 minutes.' },
    { status: 423 }
  );
}

// After successful login:
if (user.loginAttempts > 0 || user.lockedUntil) {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
    },
  });
}
```

---

### Action 8: Update JWT Expiry (10 minutes)

**File**: `src/lib/auth.ts:20`

**Change**:
```typescript
// OLD:
const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
  expiresIn: '7d'
});

// NEW:
const token = jwt.sign({ userId: user.id, email: user.email }, secret, {
  expiresIn: '2h'  // Reduced from 7 days to 2 hours
});
```

**Note**: For production, implement refresh token mechanism for better UX

---

### Action 9: Test Everything (30-60 minutes)

**Critical Tests**:
```bash
# 1. Build the application
npm run build

# 2. Start production server locally
npm run start
```

**Test These Flows**:
- [ ] User registration
- [ ] User login
- [ ] Password reset email sends
- [ ] Failed login locks account after 5 attempts
- [ ] Admin login
- [ ] Add product to cart
- [ ] Checkout process
- [ ] Stripe payment (use test mode)
- [ ] Webhook receives and processes correctly
- [ ] Order confirmation email sends
- [ ] Rate limiting blocks excessive requests

**Check for Errors**:
- Monitor console/logs for errors
- Check all environment variables are set
- Verify database migrations ran
- Test on multiple browsers

---

### Action 10: Production Environment Setup (15-20 minutes)

**On your hosting platform** (Vercel/Netlify/etc):

1. **Add ALL environment variables** from `.env.example`:
   - Database URL (production database)
   - JWT_SECRET (generated in Action 2)
   - SESSION_SECRET (generated in Action 2)
   - Stripe keys (production keys from Action 4)
   - Email service keys (from Action 5)
   - FedEx credentials (production)
   - All other required variables

2. **Set production-specific variables**:
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   COOKIE_SECURE=true
   LOG_LEVEL=error
   DEBUG=false
   ```

3. **Deploy and test**:
   - Deploy to production
   - Test complete purchase flow
   - Verify webhook endpoint works
   - Check email delivery
   - Monitor error logs

---

##  COMPLETION CHECKLIST

After completing all actions above, verify:

- [ ] Secrets are strong and not in git
- [ ] Admin password is hashed with bcrypt
- [ ] Production Stripe keys configured
- [ ] Email service working
- [ ] Webhook idempotency implemented
- [ ] Account lockout implemented
- [ ] JWT expiry reduced to 2 hours
- [ ] All tests passed
- [ ] Production environment configured
- [ ] No errors in logs

---

## =¨ IF YOU ENCOUNTER ISSUES

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues
```bash
# Reset database (  DELETES ALL DATA)
npx prisma migrate reset

# Or just run migrations
npx prisma migrate deploy
```

### Environment Variable Errors
- Double-check all variables in `.env`
- Ensure no typos in variable names
- Verify quotes around values with special characters

---

## =Ú NEXT STEPS

After completing these immediate actions:

1. **Read**: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
2. **Review**: [SECURITY_ADVISORY.md](SECURITY_ADVISORY.md)
3. **Fix**: High priority issues (logging, input validation, TypeScript types)
4. **Monitor**: Set up error tracking and monitoring
5. **Optimize**: Performance and database queries

---

## ð TIME ESTIMATE

- **Minimum** (critical only): 2 hours
- **Recommended** (all actions): 3-4 hours
- **Thorough** (with testing): 5-6 hours

**Do not rush these steps. Security is critical.**

---

## <˜ NEED HELP?

Refer to these documents:
- **Environment setup**: [.env.example](.env.example)
- **Complete checklist**: [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
- **Security details**: [SECURITY_ADVISORY.md](SECURITY_ADVISORY.md)
- **Deployment guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Last Updated**: 2025-10-28
**Version**: 1.0
