/**
 * Générateur d'image 360° panoramique à partir de frames individuelles
 * 
 * Ce script combine plusieurs frames d'une rotation 360° en une seule image panoramique
 * qui peut être utilisée avec le composant SimpleRotation360
 * 
 * Usage:
 * node scripts/generate-panoramic-360.js <product_id> [options]
 * 
 * Exemple:
 * node scripts/generate-panoramic-360.js cm6abcd123 --frames 36 --quality 90
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generatePanoramic360(productId, options = {}) {
  const {
    frames = 36,
    quality = 85,
    inputDir = path.join(process.cwd(), 'public', '360 JPG', productId),
    outputDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId),
    outputName = '360.jpg',
    frameWidth = null, // Auto-détecté
    frameHeight = null, // Auto-détecté
  } = options;

  console.log(`🎨 Génération d'image panoramique 360° pour le produit ${productId}`);
  console.log(`📁 Répertoire source: ${inputDir}`);
  console.log(`📊 Nombre de frames: ${frames}`);

  try {
    // Vérifier que le répertoire source existe
    try {
      await fs.access(inputDir);
    } catch (err) {
      throw new Error(`Le répertoire source n'existe pas: ${inputDir}`);
    }

    // Lire les frames
    console.log('\n📸 Chargement des frames...');
    const frameImages = [];
    
    for (let i = 1; i <= frames; i++) {
      const frameNumber = String(i).padStart(3, '0');
      const framePath = path.join(inputDir, `${frameNumber}.jpg`);
      
      try {
        const frameBuffer = await fs.readFile(framePath);
        const metadata = await sharp(frameBuffer).metadata();
        
        frameImages.push({
          buffer: frameBuffer,
          width: metadata.width,
          height: metadata.height,
        });
        
        process.stdout.write(`\r   Frame ${i}/${frames} chargée`);
      } catch (err) {
        console.error(`\n   ⚠️  Avertissement: Frame ${frameNumber}.jpg introuvable, ignorée`);
      }
    }
    
    console.log(`\n   ✓ ${frameImages.length} frames chargées`);

    if (frameImages.length === 0) {
      throw new Error('Aucune frame trouvée');
    }

    // Utiliser les dimensions de la première frame
    const width = frameImages[0].width;
    const height = frameImages[0].height;
    
    console.log(`\n📐 Dimensions des frames: ${width}x${height}`);

    // Calculer les dimensions de l'image panoramique
    const panoramicWidth = width * frameImages.length;
    const panoramicHeight = height;
    
    console.log(`📐 Dimensions panoramique: ${panoramicWidth}x${panoramicHeight}`);

    // Créer une image vide
    console.log('\n🔨 Création de l\'image panoramique...');
    
    // Préparer les composites
    const composites = [];
    for (let i = 0; i < frameImages.length; i++) {
      composites.push({
        input: frameImages[i].buffer,
        left: i * width,
        top: 0,
      });
      
      process.stdout.write(`\r   Assemblage frame ${i + 1}/${frameImages.length}`);
    }

    // Créer l'image panoramique
    const panoramicImage = await sharp({
      create: {
        width: panoramicWidth,
        height: panoramicHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite(composites)
      .jpeg({ quality })
      .toBuffer();

    console.log(`\n   ✓ Image panoramique créée (${(panoramicImage.length / 1024 / 1024).toFixed(2)} MB)`);

    // Créer le répertoire de sortie si nécessaire
    await fs.mkdir(outputDir, { recursive: true });

    // Sauvegarder l'image
    const outputPath = path.join(outputDir, outputName);
    await fs.writeFile(outputPath, panoramicImage);
    
    console.log(`\n✅ Image panoramique sauvegardée: ${outputPath}`);
    console.log(`📊 Taille finale: ${(panoramicImage.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔗 URL relative: /uploads/products/${productId}/${outputName}`);

    // Retourner l'URL relative pour mise à jour DB
    return `/uploads/products/${productId}/${outputName}`;

  } catch (error) {
    console.error('\n❌ Erreur lors de la génération:', error.message);
    throw error;
  }
}

// Si exécuté directement
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node scripts/generate-panoramic-360.js <product_id> [options]

Options:
  --frames <number>     Nombre de frames (défaut: 36)
  --quality <number>    Qualité JPEG 1-100 (défaut: 85)
  --input <path>        Répertoire des frames (défaut: public/360 JPG/<product_id>)
  --output <path>       Répertoire de sortie (défaut: public/uploads/products/<product_id>)

Exemples:
  node scripts/generate-panoramic-360.js cm6abcd123
  node scripts/generate-panoramic-360.js cm6abcd123 --frames 72 --quality 90
    `);
    process.exit(0);
  }

  const productId = args[0];
  const options = {};

  // Parser les options
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'frames' || key === 'quality') {
      options[key] = parseInt(value, 10);
    } else if (key === 'input' || key === 'output') {
      options[key === 'input' ? 'inputDir' : 'outputDir'] = value;
    }
  }

  generatePanoramic360(productId, options)
    .then((url) => {
      console.log(`\n🎉 Terminé ! URL: ${url}`);
      console.log('\n💡 Prochaine étape: Mettre à jour la base de données avec cette URL');
      console.log(`   UPDATE products SET "rotationImage360Url" = '${url}' WHERE id = '${productId}';`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { generatePanoramic360 };
