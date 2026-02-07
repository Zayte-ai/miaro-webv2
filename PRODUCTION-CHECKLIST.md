# ✅ Checklist de Mise en Production - MaisonMiaro

## 🔒 Sécurité

- [ ] **Variables d'environnement**
  - [ ] Toutes les variables requises sont définies dans Vercel
  - [ ] JWT_SECRET fait au moins 32 caractères
  - [ ] ADMIN_PASSWORD est sécurisé (min 12 caractères, majuscules, chiffres, symboles)
  - [ ] Clés Stripe en mode LIVE (`pk_live_` et `sk_live_`)

- [ ] **Base de données**
  - [ ] Migration Prisma appliquée (`npx prisma migrate deploy`)
  - [ ] Backup configuré
  - [ ] Connexion SSL activée
  - [ ] Credentials sécurisés

- [ ] **Headers de sécurité**
  - [x] X-Content-Type-Options: nosniff
  - [x] X-Frame-Options: DENY
  - [x] X-XSS-Protection
  - [x] Referrer-Policy
  - [x] Permissions-Policy

## 💳 Stripe / Paiements

- [ ] **Configuration Stripe**
  - [ ] Compte Stripe en mode LIVE activé
  - [ ] Webhooks configurés pour production
  - [ ] URL de webhook définie: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Tous les produits ont un `stripePriceId` valide
  - [ ] Test de paiement effectué en mode LIVE

- [ ] **Price IDs Stripe**
  - [ ] Vérifier que tous les produits actifs ont un stripePriceId
  - [ ] Tester le checkout avec chaque produit

## 🗄️ Base de données

- [ ] **Prisma**
  - [ ] Schema à jour
  - [ ] Migrations appliquées
  - [ ] Seed data désactivé (`SEED_DEMO_DATA=false`)
  - [ ] Index créés pour les performances

- [ ] **Données initiales**
  - [ ] Admin créé avec mot de passe sécurisé
  - [ ] Catégories créées
  - [ ] Produits de test supprimés

## 🌐 Configuration Vercel

- [ ] **Domaine**
  - [ ] Domaine personnalisé configuré
  - [ ] SSL/HTTPS activé
  - [ ] Redirections HTTP → HTTPS

- [ ] **Variables d'environnement**
  ```
  DATABASE_URL
  DIRECT_URL
  JWT_SECRET
  ADMIN_EMAIL
  ADMIN_PASSWORD
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  STRIPE_SECRET_KEY
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_BASE_URL
  SMTP_HOST (optionnel)
  SMTP_PORT (optionnel)
  SMTP_USER (optionnel)
  SMTP_PASSWORD (optionnel)
  ```

- [ ] **Build Settings**
  - [ ] Framework preset: Next.js
  - [ ] Build command: `prisma generate && next build`
  - [ ] Output directory: `.next`
  - [ ] Install command: `npm install`

## 📧 Email

- [ ] **SMTP configuré (si utilisé)**
  - [ ] Serveur SMTP testé
  - [ ] Credentials valides
  - [ ] Email de contact fonctionne

## 🖼️ Assets & Media

- [ ] **Images**
  - [ ] Images optimisées (WebP/AVIF)
  - [ ] Images 360° uploadées
  - [ ] Tous les produits ont des images

- [ ] **CDN**
  - [ ] Images servies via CDN Vercel
  - [ ] Cache headers configurés

## 🧪 Tests avant déploiement

- [ ] **Tests fonctionnels**
  - [ ] Création de compte utilisateur
  - [ ] Login/Logout
  - [ ] Ajout au panier
  - [ ] Processus de checkout complet
  - [ ] Paiement test en mode LIVE
  - [ ] Admin login
  - [ ] Création de produit
  - [ ] Modification de produit

- [ ] **Tests de performance**
  - [ ] Lighthouse score > 90
  - [ ] Temps de chargement < 3s
  - [ ] Images lazy-loaded

- [ ] **Tests mobile**
  - [ ] Navigation mobile
  - [ ] Checkout mobile
  - [ ] Images responsive

## 📊 Monitoring & Analytics

- [ ] **Monitoring**
  - [ ] Vercel Analytics activé
  - [ ] Error tracking configuré
  - [ ] Logs accessibles

- [ ] **SEO**
  - [ ] Meta tags configurés
  - [ ] sitemap.xml généré
  - [ ] robots.txt configuré

## 🚀 Déploiement

- [ ] **Pre-deploy**
  - [ ] Code review effectué
  - [ ] Tests passés localement
  - [ ] Build local réussi
  - [ ] Pas de console.log inutiles

- [ ] **Deploy**
  - [ ] Build Vercel réussi
  - [ ] Migrations DB appliquées
  - [ ] Variables d'env validées

- [ ] **Post-deploy**
  - [ ] Site accessible
  - [ ] Checkout fonctionne
  - [ ] Admin accessible
  - [ ] Aucune erreur dans les logs

## 📝 Documentation

- [ ] **Guides**
  - [ ] Guide admin (création produits, gestion commandes)
  - [ ] Guide Stripe (ajout de prix)
  - [ ] README à jour

## 🔧 Commandes utiles

```bash
# Local
npm run build              # Tester le build
npx prisma migrate deploy  # Appliquer migrations
npx prisma studio         # Interface DB

# Production (Vercel)
vercel --prod             # Déployer en production
vercel env pull           # Récupérer les env vars
vercel logs               # Voir les logs
```

## ⚠️ Problèmes connus à surveiller

- [ ] Client Prisma régénéré après modification du schema
- [ ] Port 3000 parfois occupé → utilise 3002
- [ ] PayPal nécessite activation dans Stripe Dashboard
- [ ] Images 360° nécessitent upload via admin panel

## 📞 Support

- Stripe Dashboard: https://dashboard.stripe.com
- Vercel Dashboard: https://vercel.com/dashboard
- Documentation Next.js: https://nextjs.org/docs

---

**Date du déploiement:** _______________
**Version:** _______________
**Déployé par:** _______________
