import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import prisma from "@/lib/db";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = verifyAdminToken(token);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    const productId = params.id;

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les fichiers depuis la requête
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const frameNumber = formData.get("frameNumber") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Vérifier les types MIME
    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    for (const file of files) {
      if (!validMimeTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: "Type de fichier invalide. Seuls les fichiers .jpg/.jpeg/.png sont acceptés",
          },
          { status: 400 }
        );
      }
    }

    // Créer le répertoire 360 si nécessaire
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products",
      productId,
      "360"
    );

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFrames: number[] = [];

    // Sauvegarder chaque fichier
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const frameNum = frameNumber ? parseInt(frameNumber) + i : i + 1;
      const fileName = `img${frameNum}.jpg`;
      const filePath = path.join(uploadDir, fileName);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      uploadedFrames.push(frameNum);
    }

    // Mettre à jour la base de données pour indiquer que le produit a des images 360°
    await prisma.product.update({
      where: { id: productId },
      data: { has360Images: true },
    });

    return NextResponse.json({
      success: true,
      message: `${uploadedFrames.length} frame(s) 360° uploadée(s) avec succès`,
      data: { uploadedFrames, totalFrames: uploadedFrames.length },
    });
  } catch (error) {
    console.error("Erreur upload 360:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'upload de l'image 360°",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "Non autorisé" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = verifyAdminToken(token);

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Token invalide" },
        { status: 401 }
      );
    }

    const productId = params.id;

    // Vérifier que le produit existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Produit introuvable" },
        { status: 404 }
      );
    }

    // Supprimer le dossier 360 si il existe
    const dir360Path = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products",
      productId,
      "360"
    );

    if (existsSync(dir360Path)) {
      const { rm } = await import("fs/promises");
      await rm(dir360Path, { recursive: true, force: true });
    }

    // Mettre à jour la base de données
    await prisma.product.update({
      where: { id: productId },
      data: { has360Images: false },
    });

    return NextResponse.json({
      success: true,
      message: "Image 360° supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression 360:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de la suppression de l'image 360°",
      },
      { status: 500 }
    );
  }
}
