# Product Image Frames Directory

This directory contains the 360-degree image frames for each product. Each product has its own folder named by its ID, containing 35 sequentially numbered image frames.

## Legacy Format
Current images follow this naming convention:
- white-tee-1.jpg, white-tee-2.jpg
- hoodie-1.jpg, hoodie-2.jpg
- jeans-1.jpg, jeans-2.jpg
- jacket-1.jpg, jacket-2.jpg
- beanie-1.jpg, beanie-2.jpg

## New 360° Image Structure

```
/public/images/products/
├── 1/                      # Product ID 1 - Classic White Tee
│   ├── 001.jpg             # Frame 1
│   ├── 002.jpg             # Frame 2
│   ├── ...
│   └── 035.jpg             # Frame 35
├── 2/                      # Product ID 2 - Oversized Hoodie
│   ├── 001.jpg
│   └── ...
└── ...
```

## Image Requirements

- All images should be in the same aspect ratio (preferably 1:1 square)
- Recommended resolution: 1200x1200px
- File format: JPG or WebP (for better compression)
- Each product should have exactly 35 frames for a complete 360° view
- Images should be sequentially numbered from 001.jpg to 035.jpg

## Adding New Products

When adding a new product:

1. Create a new folder with the product ID
2. Add 35 sequential images numbered 001.jpg through 035.jpg
3. Update the product data in `src/lib/data.ts` to include `imageFrames: 35`

## Placeholder Images

Until proper 360-degree product photography is available, each folder contains placeholder images that will be used with the slider component. The slider will still function but will only toggle between these images.
