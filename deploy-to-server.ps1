# Script de déploiement rapide vers le serveur
# Utilise SCP pour transférer les fichiers modifiés

$SERVER = "admin1@maison-miaro-server"
$REMOTE_PATH = "~/miaro-webv2"

Write-Host "Déploiement des fichiers vers le serveur..." -ForegroundColor Green

# Copier le fichier middleware.ts
Write-Host "Transfert de middleware.ts..."
scp "src/middleware.ts" "${SERVER}:${REMOTE_PATH}/src/middleware.ts"

# Copier le nouveau fichier API /api/auth/me
Write-Host "Transfert de /api/auth/me/route.ts..."
ssh $SERVER "mkdir -p ${REMOTE_PATH}/src/app/api/auth/me"
scp "src/app/api/auth/me/route.ts" "${SERVER}:${REMOTE_PATH}/src/app/api/auth/me/route.ts"

Write-Host "Fichiers transférés avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "Maintenant, connectez-vous au serveur et exécutez:" -ForegroundColor Yellow
Write-Host "cd ~/miaro-webv2" -ForegroundColor Cyan
Write-Host "npm run build" -ForegroundColor Cyan
Write-Host "pm2 restart maisonmiaro" -ForegroundColor Cyan
