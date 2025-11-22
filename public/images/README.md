# Image Organization for MaisonMiaro Website

This directory structure organizes all images for the website. Jakob can place images in the appropriate folders as they become available.

## Directory Structure

### `/public/images/`
Main images directory - all images should be placed here or in subdirectories

### `/public/images/products/`
**Product photography** - Individual clothing item photos
- Format: JPG, PNG, or WebP
- Size: 1000x1000px minimum (square aspect ratio)
- Naming: `product-name-1.jpg`, `product-name-2.jpg`, etc.
- Examples: `white-tee-1.jpg`, `hoodie-1.jpg`, `jeans-1.jpg`

### `/public/images/hero/`
**Hero/Banner images** - Large promotional images
- Format: JPG or WebP
- Size: 1920x1080px or larger
- High quality, professional photography
- Used on homepage and category pages

### `/public/images/about/`
**About page images** - Brand story, team photos, behind-the-scenes
- Format: JPG or WebP
- Size: Varies (optimize for web)
- Examples: Jakob's portrait, atelier photos, craftsmanship details

### `/public/images/categories/`
**Category headers** - Images representing product categories
- Format: JPG or WebP
- Size: 800x400px recommended
- Examples: t-shirts category, hoodies category, etc.

### `/public/models/`
**3D Models** - Interactive 3D clothing models
- Format: GLB (preferred) or GLTF
- Optimized for web (< 5MB per model)
- Naming: `product-name.glb`
- Examples: `white-tee.glb`, `hoodie.glb`

## Image Guidelines

### Quality Standards
- High resolution, well-lit professional photography
- Consistent lighting and background
- Multiple angles for each product
- Color-accurate representation

### Optimization
- Compress images for web without quality loss
- Use modern formats (WebP) when possible
- Include alt text descriptions
- Optimize file sizes for fast loading

### Naming Convention
- Use lowercase, hyphen-separated names
- Be descriptive and consistent
- Include variant numbers for multiple images
- Examples: `classic-white-tee-front.jpg`, `oversized-hoodie-side.jpg`

## Video Support
The website also supports video content:
- Place videos in `/public/videos/`
- Use MP4 format for best compatibility
- Optimize for web streaming
- Examples: brand story videos, product showcases

Jakob can start by adding product images to the `/products/` directory and 3D models to the `/models/` directory as they become available.
