# Testing Checklist - MaisonMiaro

Use this checklist to quickly test all features of the application.

## ✅ Initial Setup

- [ ] Node.js 18+ installed and verified (`node --version`)
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file created and configured
- [ ] Database setup completed (`npm run db:push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Stripe test keys added to `.env`
- [ ] Dev server running (`npm run dev`)
- [ ] Homepage loads at http://localhost:3000

---

## 🏠 Homepage & Navigation

- [ ] Homepage displays correctly with hero section
- [ ] Navigation menu is visible
- [ ] All navigation links work (Home, Shop, About, Contact)
- [ ] Footer displays correctly
- [ ] Logo is visible and clickable

---

## 🛍️ Product Browsing

- [ ] Shop page displays products grid
- [ ] Can navigate between categories:
  - [ ] All Products
  - [ ] T-Shirts
  - [ ] Hoodies
  - [ ] Jeans
  - [ ] Jackets
  - [ ] Accessories
- [ ] Product cards show:
  - [ ] Product image
  - [ ] Product name
  - [ ] Price
  - [ ] Quick add to cart button
- [ ] Search functionality works
- [ ] Filter/sort options work (if available)

---

## 📦 Product Details

- [ ] Click product opens detail page
- [ ] Product images display correctly
- [ ] Can view multiple product images (slider)
- [ ] 3D viewer works (if model available)
  - [ ] Can rotate model
  - [ ] Can zoom in/out
- [ ] Product information displays:
  - [ ] Name
  - [ ] Price
  - [ ] Description
  - [ ] Size options
  - [ ] Color options (if available)
- [ ] Can select size
- [ ] Can adjust quantity
- [ ] "Add to Cart" button works
- [ ] Success message appears when added to cart

---

## 🛒 Shopping Cart

### Adding Items
- [ ] Add 3+ different products to cart
- [ ] Cart icon shows correct item count
- [ ] Cart badge updates in real-time

### Cart Page
- [ ] Click cart icon opens cart view
- [ ] All added items display correctly
- [ ] Each item shows:
  - [ ] Product image
  - [ ] Product name
  - [ ] Size/variant
  - [ ] Price
  - [ ] Quantity controls
  - [ ] Remove button
- [ ] Can increase quantity
- [ ] Can decrease quantity
- [ ] Can remove items
- [ ] Subtotal updates correctly
- [ ] Total price is accurate

### Cart Persistence
- [ ] Refresh page - cart items remain
- [ ] Close browser and reopen - cart persists
- [ ] Cart works across different pages

---

## 🔐 User Authentication

### Registration
- [ ] Navigate to `/auth/register`
- [ ] Registration form displays
- [ ] Can create new account:
  - [ ] First name field works
  - [ ] Last name field works
  - [ ] Email field works
  - [ ] Password field works
  - [ ] Password confirmation works
- [ ] Form validation works:
  - [ ] Required fields show errors
  - [ ] Email format validated
  - [ ] Password strength validated
- [ ] Successful registration redirects to account

### Login
- [ ] Navigate to `/auth/login`
- [ ] Can login with registered credentials
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Successful login redirects correctly
- [ ] User name shows in navigation when logged in

### Password Reset
- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter registered email
- [ ] Reset token generated (check console/logs)
- [ ] Can access reset password page
- [ ] Can set new password

### Logout
- [ ] Logout button/link visible when logged in
- [ ] Clicking logout logs out user
- [ ] Redirects to homepage or login

---

## 💳 Checkout & Payments

### Start Checkout
- [ ] Cart has items
- [ ] Click "Checkout" or "Proceed to Checkout"
- [ ] Redirects to checkout page
- [ ] Order summary displays correctly

### Stripe Checkout
- [ ] Stripe Checkout loads
- [ ] Order items display in Stripe
- [ ] Total amount is correct

### Test Successful Payment
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: `12/25` (any future date)
- [ ] CVC: `123` (any 3 digits)
- [ ] Name: Any name
- [ ] Complete payment
- [ ] Redirects to success page
- [ ] Success message displays
- [ ] Order confirmation shown

### Test Failed Payment
- [ ] Use declined card: `4000 0000 0000 0002`
- [ ] Same details as above
- [ ] Payment fails
- [ ] Error message shown
- [ ] Can try again

---

## 👤 User Account

### Account Dashboard
- [ ] Navigate to `/account`
- [ ] Profile information displays
- [ ] Can view account details
- [ ] Edit profile button works (if available)

### Order History
- [ ] Navigate to `/account/orders`
- [ ] Previous orders display
- [ ] Each order shows:
  - [ ] Order number
  - [ ] Date
  - [ ] Total amount
  - [ ] Status
  - [ ] Items ordered
- [ ] Can click for order details
- [ ] Can track order (if available)

### Wishlist
- [ ] Navigate to `/account/wishlist`
- [ ] Can add products to wishlist from product pages
- [ ] Wishlist items display
- [ ] Can remove from wishlist
- [ ] Can move to cart from wishlist
- [ ] Heart icon shows on wishlisted products

### Account Settings
- [ ] Navigate to `/account/settings`
- [ ] Can update personal information
- [ ] Can change password
- [ ] Can update email preferences (if available)
- [ ] Changes save successfully

### Payment Methods
- [ ] Navigate to `/account/payment`
- [ ] Saved payment methods display (if feature enabled)
- [ ] Can add new payment method
- [ ] Can remove payment method

---

## 🔧 Admin Panel (If Configured)

### Admin Login
- [ ] Navigate to `/admin/login` (or admin route)
- [ ] Can login with admin credentials from `.env`
- [ ] Redirects to admin dashboard

### Analytics Dashboard
- [ ] Dashboard loads
- [ ] Sales metrics display:
  - [ ] Total revenue
  - [ ] Total orders
  - [ ] Average order value
- [ ] Charts/graphs display correctly
- [ ] Date range filter works
- [ ] Can export analytics

### Product Management
- [ ] Product list displays
- [ ] Can search products
- [ ] Can filter products
- [ ] Can add new product:
  - [ ] Name, description
  - [ ] Price
  - [ ] Images
  - [ ] Category
  - [ ] Inventory
- [ ] Can edit existing product
- [ ] Can delete product
- [ ] Changes reflect on frontend

### Order Management
- [ ] Order list displays
- [ ] Can view order details
- [ ] Can update order status
- [ ] Can mark as shipped/delivered

---

## 📱 Responsive Design

### Mobile (375px - Phone)
- [ ] Open Dev Tools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select iPhone or similar
- [ ] Navigation works (hamburger menu)
- [ ] Products display in grid (1-2 columns)
- [ ] Product details readable
- [ ] Cart accessible
- [ ] Checkout works
- [ ] All forms usable

### Tablet (768px - iPad)
- [ ] Switch to tablet view
- [ ] Products display well (2-3 columns)
- [ ] Navigation adapted for tablet
- [ ] All features accessible

### Desktop (1920px)
- [ ] Switch to desktop view
- [ ] Products display in full grid (3-4 columns)
- [ ] All features optimal
- [ ] No layout issues

---

## 🎨 3D Features & Performance

### 3D Product Viewer
- [ ] Select product with 3D model
- [ ] 3D viewer loads
- [ ] Model displays correctly
- [ ] Can rotate model (mouse drag)
- [ ] Can zoom (scroll/pinch)
- [ ] Smooth performance
- [ ] No lag or stutter

### Image Quality
- [ ] Product images are clear
- [ ] Images load quickly
- [ ] No broken images
- [ ] Proper image sizing

### Page Performance
- [ ] Pages load in under 3 seconds
- [ ] Smooth scrolling
- [ ] No layout shifts
- [ ] Animations smooth

---

## 🐛 Error Handling

- [ ] Try invalid URLs (404 page works)
- [ ] Try accessing protected routes when logged out
- [ ] Submit empty forms (validation works)
- [ ] Try adding out-of-stock items
- [ ] Test with slow network (Chrome DevTools)
- [ ] Check browser console for errors (should be minimal)

---

## 🔒 Security Checks

- [ ] Passwords are hidden in forms
- [ ] Can't access admin without login
- [ ] Can't access other user's orders
- [ ] Payment info handled by Stripe (PCI compliant)
- [ ] HTTPS redirect works (in production)

---

## 🌐 Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## 📊 Final Checks

- [ ] All core features working
- [ ] No console errors
- [ ] Database has data
- [ ] Stripe test payments work
- [ ] User flow is smooth
- [ ] Admin panel functional (if enabled)
- [ ] Mobile experience good
- [ ] Ready to show/deploy

---

## 🎉 Testing Complete!

If all items are checked:
✅ **Application is fully functional and ready!**

## ⚠️ Found Issues?

1. Check browser console for errors
2. Check terminal for server errors
3. Review [SETUP.md](./SETUP.md) troubleshooting section
4. Verify `.env` configuration
5. Ensure database is running
6. Clear browser cache and retry

---

**Quick Test Card Reference:**
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- Expiry: Any future date (12/25)
- CVC: Any 3 digits (123)
