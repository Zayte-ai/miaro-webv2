# Guide: Intégration Stripe Price ID

## 🎯 Objectif
Vous pouvez maintenant lier vos produits à Stripe **directement depuis l'admin panel**, sans modifier le code!

## 📋 Étapes pour lier un produit à Stripe

### 1. Démarrer Docker et la base de données
```bash
# Démarrer Docker Desktop
# Puis lancer la base de données
docker-compose up -d

# Appliquer la migration pour ajouter la colonne stripePriceId
npx prisma db push
```

### 2. Créer le prix dans Stripe Dashboard

1. Allez sur **[Stripe Dashboard → Products](https://dashboard.stripe.com/products)** (MODE LIVE)
2. Cliquez sur **"+ Add product"**
3. Remplissez:
   - **Name**: Le nom de votre produit (ex: "T-Shirt MaisonMiaro Noir")
   - **Description**: (optionnel)
   - **Pricing**:
     - Cochez **"One time"** (paiement unique)
     - Prix: ex: 50.00
     - Currency: **CAD**
4. Cliquez **"Save product"**
5. **IMPORTANT**: Copiez le **Price ID** affiché par Stripe
   - Format: `price_1xxxxxxxxxxxxx`

### 3. Ajouter le Price ID dans votre admin panel

#### Pour un NOUVEAU produit:
1. Allez sur http://localhost:3000/admin/dashboard/products
2. Cliquez sur **"Add Product"**
3. Remplissez tous les champs du produit
4. Dans la section **"Stripe Price ID 💳"** (encadré bleu):
   - Collez le Price ID que vous avez copié depuis Stripe
5. Cliquez **"Create product"**

#### Pour un produit EXISTANT:
1. Allez sur http://localhost:3000/admin/dashboard/products
2. Cliquez sur **"Edit"** à côté du produit
3. Trouvez la section **"Stripe Price ID 💳"** (encadré bleu)
4. Collez le Price ID
5. Cliquez **"Save Changes"**

### 4. Tester le checkout

1. Ajoutez le produit au panier sur votre site
2. Allez au checkout
3. Le paiement Stripe devrait fonctionner avec le bon prix!

## ✅ Avantages de cette méthode

- ✨ **Pas besoin de modifier le code** à chaque nouveau produit
- 💾 **Stocké en base de données** avec le produit
- 🔄 **Facile à mettre à jour** via l'admin panel
- 🛡️ **Sécurisé** - le price ID est validé côté serveur
- 🔙 **Rétrocompatible** - les anciens produits dans PRICE_MAP fonctionnent toujours

## ⚠️ Important

- Utilisez toujours les clés **LIVE** de Stripe (pk_live_ et sk_live_)
- Le Price ID doit commencer par `price_`
- Chaque produit doit avoir son propre prix dans Stripe
- Testez le checkout après avoir ajouté le Price ID

## 🔍 Vérification

Pour vérifier que tout fonctionne:
```bash
# Lister vos produits et leurs Price IDs
node setup-stripe-prices.js

# Vérifier un Price ID spécifique
node verify-stripe-price.js
```

## 🆘 En cas de problème

Si le checkout ne fonctionne pas:
1. Vérifiez que le Price ID est correct (commence par `price_`)
2. Vérifiez que le produit est actif dans Stripe Dashboard
3. Vérifiez les logs de la console (F12) pour voir l'erreur exacte
4. Assurez-vous que vos clés Stripe LIVE sont correctes dans `.env`

---

**🎉 C'est tout! Maintenant vous pouvez gérer vos prix Stripe directement depuis votre admin panel!**
