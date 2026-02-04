import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir, unlink, readdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

// Taille maximale par fichier (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Formats autorisés
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const images = formData.getAll('images') as File[];
    const frameNumbersStr = formData.getAll('frameNumbers') as string[];

    // Validation des entrées
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid Product ID is required' },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No images provided' },
        { status: 400 }
      );
    }

    // Limite raisonnable d'images
    if (images.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Maximum 100 images allowed' },
        { status: 400 }
      );
    }

    // Valider chaque fichier
    for (const image of images) {
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: `File ${image.name} exceeds 5MB limit` },
          { status: 400 }
        );
      }

      if (!ALLOWED_FORMATS.includes(image.type)) {
        return NextResponse.json(
          { success: false, message: `File ${image.name} has invalid format. Only JPEG, PNG, and WebP allowed` },
          { status: 400 }
        );
      }
    }

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    // Créer le dossier 360 pour ce produit
    const productFolder = path.join(process.cwd(), 'public', 'images', 'products', productId, '360');
    
    if (!existsSync(productFolder)) {
      await mkdir(productFolder, { recursive: true });
    }

    // Supprimer les anciennes images du système de fichiers
    try {
      const existingFiles = await readdir(productFolder);
      await Promise.all(
        existingFiles.map(file => unlink(path.join(productFolder, file)))
      );
    } catch (err) {
      // Le dossier n'existe pas encore ou est vide
      console.log('No existing files to delete');
    }

    // Supprimer les anciennes entrées en base de données
    await prisma.product360Image.deleteMany({
      where: { productId },
    });

    const uploadedImages: Array<{ url: string; frameNumber: number }> = [];

    // Uploader et sauvegarder chaque image
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const frameNumber = parseInt(frameNumbersStr[i] || String(i + 1));

      if (isNaN(frameNumber) || frameNumber < 1) {
        return NextResponse.json(
          { success: false, message: 'Invalid frame number' },
          { status: 400 }
        );
      }

      // Générer un nom de fichier sécurisé avec padding
      const paddedNumber = String(frameNumber).padStart(3, '0');
      const extension = image.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${paddedNumber}.${extension}`;
      const filepath = path.join(productFolder, filename);

      // Convertir le fichier en buffer et sauvegarder
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // URL relative pour la base de données
      const url = `/images/products/${productId}/360/${filename}`;

      uploadedImages.push({
        url,
        frameNumber,
      });
    }

    // Sauvegarder en base de données dans une transaction
    await prisma.$transaction([
      prisma.product360Image.createMany({
        data: uploadedImages.map((img, index) => ({
          productId,
          url: img.url,
          frameNumber: img.frameNumber,
          sortOrder: index,
        })),
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          has360Images: true,
          imageFrames: images.length,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${images.length} 360° images`,
      data: {
        count: images.length,
        images: uploadedImages,
      },
    });
  } catch (error) {
    console.error('Error uploading 360° images:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to upload 360° images' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid Product ID is required' },
        { status: 400 }
      );
    }

    const images = await prisma.product360Image.findMany({
      where: { productId },
      orderBy: { frameNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error('Error fetching 360° images:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch 360° images' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Valid Product ID is required' },
        { status: 400 }
      );
    }

    // Supprimer les fichiers du système de fichiers
    const productFolder = path.join(process.cwd(), 'public', 'images', 'products', productId, '360');
    
    try {
      if (existsSync(productFolder)) {
        const files = await readdir(productFolder);
        await Promise.all(
          files.map(file => unlink(path.join(productFolder, file)))
        );
      }
    } catch (err) {
      console.error('Error deleting files:', err);
    }

    // Supprimer de la base de données dans une transaction
    await prisma.$transaction([
      prisma.product360Image.deleteMany({
        where: { productId },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          has360Images: false,
          imageFrames: 35,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '360° images deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting 360° images:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to delete 360° images' },
      { status: 500 }
    );
  }
}
