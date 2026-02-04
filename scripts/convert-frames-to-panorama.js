const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createPanorama() {
  console.log('🔄 Creating panoramic image from frames...');
  
  const inputFolder = path.join(__dirname, '..', 'public', '360 JPG');
  const outputFile = path.join(__dirname, '..', 'public', 'uploads', 'panorama-360.jpg');
  
  // Get all frame files
  const files = fs.readdirSync(inputFolder)
    .filter(f => f.match(/\d{4}\.jpg$/))
    .sort();
  
  console.log(`📸 Found ${files.length} frames`);
  
  if (files.length === 0) {
    console.error('❌ No frames found in', inputFolder);
    return;
  }
  
  // Read first image to get dimensions
  const firstImage = await sharp(path.join(inputFolder, files[0])).metadata();
  const frameWidth = firstImage.width;
  const frameHeight = firstImage.height;
  
  console.log(`📐 Frame dimensions: ${frameWidth}x${frameHeight}`);
  
  // Calculate panorama dimensions
  const panoramaWidth = frameWidth * files.length;
  const panoramaHeight = frameHeight;
  
  console.log(`🖼️  Panorama dimensions: ${panoramaWidth}x${panoramaHeight}`);
  
  // Create composite images array
  const composites = [];
  for (let i = 0; i < files.length; i++) {
    composites.push({
      input: path.join(inputFolder, files[i]),
      left: i * frameWidth,
      top: 0
    });
  }
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create panorama
  await sharp({
    create: {
      width: panoramaWidth,
      height: panoramaHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(outputFile);
  
  const stats = fs.statSync(outputFile);
  console.log(`✅ Panorama created successfully!`);
  console.log(`📁 Location: ${outputFile}`);
  console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Login to admin panel: http://localhost:3000/admin');
  console.log('2. Edit a product');
  console.log('3. Upload this panorama as the 360° image');
}

createPanorama().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
