# Script de migration des images 360° vers le format StockX
# Convertit: 001.jpg → img1.jpg dans /uploads/products/{id}/360/

$ErrorActionPreference = "Stop"

Write-Host "`n🔄 Migration vers format StockX (img1.jpg, img2.jpg, ...)`n" -ForegroundColor Cyan

# Créer le dossier uploads si nécessaire
$uploadsBase = "public\uploads\products"
if (!(Test-Path $uploadsBase)) {
    New-Item -ItemType Directory -Path $uploadsBase -Force | Out-Null
    Write-Host "✅ Dossier créé: $uploadsBase" -ForegroundColor Green
}

# Liste des produits avec images 360
$productsWithImages = Get-ChildItem "public\images\products" -Directory | Where-Object {
    Test-Path "$($_.FullName)\360\*.jpg"
}

if ($productsWithImages.Count -eq 0) {
    Write-Host "⚠️  Aucune image 360° trouvée dans public\images\products\" -ForegroundColor Yellow
    exit 0
}

Write-Host "📦 Produits trouvés: $($productsWithImages.Count)`n" -ForegroundColor White

foreach ($productFolder in $productsWithImages) {
    $productId = $productFolder.Name
    $sourceFolder = "$($productFolder.FullName)\360"
    $destFolder = "$uploadsBase\$productId\360"
    
    Write-Host "  🔹 Produit: $productId" -ForegroundColor Cyan
    
    # Créer dossier de destination
    if (!(Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
    }
    
    # Récupérer toutes les images
    $images = Get-ChildItem $sourceFolder -Filter "*.jpg" | Sort-Object Name
    
    if ($images.Count -eq 0) {
        Write-Host "     ⚠️  Aucune image JPG trouvée" -ForegroundColor Yellow
        continue
    }
    
    $converted = 0
    foreach ($image in $images) {
        # Extraire le numéro (001.jpg → 1, 002.jpg → 2, etc.)
        $number = [int]$image.BaseName.TrimStart('0')
        if ($number -eq 0) { $number = 1 }
        
        $newName = "img$number.jpg"
        $destPath = Join-Path $destFolder $newName
        
        # Copier (ou déplacer si vous voulez supprimer l'ancien)
        Copy-Item $image.FullName -Destination $destPath -Force
        $converted++
    }
    
    Write-Host "     ✅ Converti: $converted images (img1.jpg → img$converted.jpg)" -ForegroundColor Green
    
    # Afficher aperçu
    $preview = Get-ChildItem $destFolder -Filter "img*.jpg" | Select-Object -First 3 | ForEach-Object { $_.Name }
    Write-Host "     📁 Aperçu: $($preview -join ', ')..." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "✨ Migration terminée!`n" -ForegroundColor Green
Write-Host "Les images sont maintenant dans:" -ForegroundColor White
Write-Host "  public\uploads\products\{productId}\360\img1.jpg" -ForegroundColor Gray
Write-Host "  public\uploads\products\{productId}\360\img2.jpg" -ForegroundColor Gray
Write-Host "  etc..." -ForegroundColor Gray
