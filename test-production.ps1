#!/usr/bin/env pwsh
# Script de test pre-production pour MaisonMiaro

Write-Host "Tests Pre-Production MaisonMiaro" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Verifier les variables d'environnement
Write-Host "1. Verification des variables d'environnement..." -ForegroundColor Yellow

$requiredEnvVars = @(
    "DATABASE_URL",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY"
)

foreach ($envVar in $requiredEnvVars) {
    $envLocal = Get-Content .env.local -ErrorAction SilentlyContinue
    $found = $envLocal | Where-Object { $_ -match "^$envVar=" }
    
    if ($found) {
        Write-Host "   OK: $envVar" -ForegroundColor Green
    } else {
        $errors += "$envVar manquant"
        Write-Host "   ERREUR: $envVar MANQUANT" -ForegroundColor Red
    }
}

# Verifier NEXT_PUBLIC_BASE_URL
$baseUrl = Get-Content .env.local -ErrorAction SilentlyContinue | Where-Object { $_ -match "^NEXT_PUBLIC_BASE_URL=" }
if ($baseUrl) {
    Write-Host "   OK: NEXT_PUBLIC_BASE_URL configure" -ForegroundColor Green
} else {
    $warnings += "NEXT_PUBLIC_BASE_URL non configure"
    Write-Host "   AVERTISSEMENT: NEXT_PUBLIC_BASE_URL non configure" -ForegroundColor Yellow
}

Write-Host ""

# 2. Verifier Docker PostgreSQL
Write-Host "2. Test PostgreSQL Docker..." -ForegroundColor Yellow

try {
    $dbTest = docker ps --filter "name=miaro-postgres" --format "{{.Status}}"
    if ($dbTest -match "Up") {
        Write-Host "   OK: PostgreSQL Docker actif" -ForegroundColor Green
    } else {
        $warnings += "PostgreSQL Docker non demarre"
        Write-Host "   AVERTISSEMENT: PostgreSQL Docker inactif" -ForegroundColor Yellow
    }
} catch {
    $warnings += "Impossible de verifier Docker"
    Write-Host "   AVERTISSEMENT: Docker non disponible" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verifier Stripe
Write-Host "3. Verification Stripe..." -ForegroundColor Yellow

$stripeKey = Get-Content .env.local -ErrorAction SilentlyContinue | Where-Object { $_ -match "^STRIPE_SECRET_KEY=" }
if ($stripeKey -match "sk_live_") {
    Write-Host "   OK: Mode LIVE" -ForegroundColor Green
} elseif ($stripeKey -match "sk_test_") {
    $warnings += "Mode TEST actif"
    Write-Host "   AVERTISSEMENT: Mode TEST" -ForegroundColor Yellow
} else {
    $errors += "Cle Stripe invalide"
    Write-Host "   ERREUR: Cle Stripe invalide" -ForegroundColor Red
}

Write-Host ""

# 4. Verifier fichiers critiques
Write-Host "4. Verification des fichiers..." -ForegroundColor Yellow

$criticalFiles = @(
    "next.config.ts",
    "vercel.json",
    "prisma/schema.prisma",
    "src/middleware.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   OK: $file" -ForegroundColor Green
    } else {
        $errors += "$file manquant"
        Write-Host "   ERREUR: $file MANQUANT" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "PRET POUR LA PRODUCTION!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "$($errors.Count) ERREUR(S):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
    exit 1
}
