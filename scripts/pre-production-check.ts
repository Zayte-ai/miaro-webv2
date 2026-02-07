#!/usr/bin/env tsx

/**
 * Script de vérification pré-production
 * Vérifie que tout est prêt pour le déploiement
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

const results: CheckResult[] = [];

function addCheck(name: string, status: 'success' | 'warning' | 'error', message: string) {
  results.push({ name, status, message });
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Vérification des variables d\'environnement...\n');

  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
  ];

  const optional = [
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'NEXT_PUBLIC_APP_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      addCheck(key, 'error', 'Variable requise manquante');
    } else {
      addCheck(key, 'success', 'Définie');
    }
  }

  for (const key of optional) {
    if (!process.env[key]) {
      addCheck(key, 'warning', 'Variable recommandée manquante');
    } else {
      addCheck(key, 'success', 'Définie');
    }
  }

  // Vérifications spécifiques
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    addCheck('JWT_SECRET Length', 'warning', 'Devrait faire au moins 32 caractères');
  }

  const stripePubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (stripePubKey && !stripePubKey.startsWith('pk_live_')) {
    addCheck('Stripe Public Key', 'warning', 'Pas en mode LIVE');
  }

  const stripeSecKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecKey && !stripeSecKey.startsWith('sk_live_')) {
    addCheck('Stripe Secret Key', 'error', 'DOIT être en mode LIVE pour la production');
  }
}

async function checkDatabase() {
  console.log('\n🗄️  Vérification de la base de données...\n');

  try {
    await prisma.$connect();
    addCheck('Database Connection', 'success', 'Connexion réussie');

    // Vérifier que l'admin existe
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      addCheck('Admin Account', 'error', 'Aucun compte admin trouvé');
    } else if (!admin.isActive) {
      addCheck('Admin Account', 'warning', 'Compte admin inactif');
    } else {
      addCheck('Admin Account', 'success', `Compte actif: ${admin.email}`);
    }

    // Vérifier les produits
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, stripePriceId: true },
    });

    if (products.length === 0) {
      addCheck('Products', 'warning', 'Aucun produit actif trouvé');
    } else {
      addCheck('Products', 'success', `${products.length} produit(s) actif(s)`);

      // Vérifier les Stripe Price IDs
      const missingPriceIds = products.filter(p => !p.stripePriceId);
      if (missingPriceIds.length > 0) {
        addCheck(
          'Stripe Price IDs',
          'error',
          `${missingPriceIds.length} produit(s) sans stripePriceId: ${missingPriceIds.map(p => p.name).join(', ')}`
        );
      } else {
        addCheck('Stripe Price IDs', 'success', 'Tous les produits ont un stripePriceId');
      }
    }

    // Vérifier les catégories
    const categories = await prisma.category.count({ where: { isActive: true } });
    if (categories === 0) {
      addCheck('Categories', 'warning', 'Aucune catégorie active');
    } else {
      addCheck('Categories', 'success', `${categories} catégorie(s) active(s)`);
    }

  } catch (error) {
    addCheck('Database Connection', 'error', `Erreur: ${(error as Error).message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkSeedData() {
  console.log('\n🌱 Vérification des données de test...\n');

  if (process.env.SEED_DEMO_DATA === 'false') {
    addCheck('Seed Data', 'success', 'Données de démo désactivées');
  } else {
    addCheck('Seed Data', 'warning', 'SEED_DEMO_DATA devrait être "false" en production');
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSULTATS DE LA VÉRIFICATION PRÉ-PRODUCTION');
  console.log('='.repeat(80) + '\n');

  let hasErrors = false;
  let hasWarnings = false;

  for (const result of results) {
    let icon = '';
    let color = '';

    switch (result.status) {
      case 'success':
        icon = '✅';
        break;
      case 'warning':
        icon = '⚠️ ';
        hasWarnings = true;
        break;
      case 'error':
        icon = '❌';
        hasErrors = true;
        break;
    }

    console.log(`${icon} ${result.name.padEnd(35)} ${result.message}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  if (hasErrors) {
    console.log('❌ ERREURS CRITIQUES DÉTECTÉES!');
    console.log('   Corrigez ces erreurs avant de déployer en production.\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  AVERTISSEMENTS DÉTECTÉS');
    console.log('   Recommandé de corriger ces points, mais pas critique.\n');
  } else {
    console.log('✅ TOUT EST PRÊT POUR LA PRODUCTION!\n');
  }
}

async function main() {
  console.log('\n🚀 VÉRIFICATION PRÉ-PRODUCTION - MAISONMIARO\n');

  await checkEnvironmentVariables();
  await checkDatabase();
  await checkSeedData();

  printResults();
}

main().catch((error) => {
  console.error('\n❌ Erreur lors de la vérification:', error);
  process.exit(1);
});
