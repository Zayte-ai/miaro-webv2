-- Migration SQL pour ajouter le champ rotationImage360Url
-- Nom: add_rotation_360_field
-- Date: 2026-01-19

-- Ajouter le nouveau champ rotationImage360Url au tableau products
ALTER TABLE "products" ADD COLUMN "rotationImage360Url" TEXT;

-- Note: Le champ est nullable, donc aucune valeur par défaut n'est nécessaire
-- Les produits existants auront NULL pour ce champ jusqu'à ce qu'une image 360° soit uploadée
