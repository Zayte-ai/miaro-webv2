"use client";

import { useRef, useState } from "react";
import { Upload, X, Eye } from "lucide-react";
import Image from "next/image";

interface Rotation360UploaderProps {
  productId: string;
  currentUrl?: string | null;
  adminToken: string;
  onUploadSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
}

export default function Rotation360Uploader({
  productId,
  currentUrl,
  adminToken,
  onUploadSuccess,
  onDeleteSuccess,
}: Rotation360UploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.match(/^image\/(jpeg|jpg)$/)) {
      setError("Seuls les fichiers .jpg/.jpeg sont acceptés");
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Le fichier ne doit pas dépasser 10 MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/products/${productId}/upload-360`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'upload");
      }

      // Mettre à jour la preview avec un timestamp pour forcer le rechargement
      const newUrl = `${data.data.rotationImage360Url}?t=${Date.now()}`;
      setPreviewUrl(newUrl);
      
      if (onUploadSuccess) {
        onUploadSuccess(data.data.rotationImage360Url);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      // Reset l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer l'image 360° ?")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}/upload-360`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la suppression");
      }

      setPreviewUrl(null);
      
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image 360° (Rotation Interactive)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload une image panoramique 360° au format JPG pour permettre la rotation interactive
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="mb-4 relative">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
              <Image
                src={previewUrl}
                alt="Preview 360°"
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.open(previewUrl, "_blank")}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
                  title="Voir en plein écran"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 transition disabled:opacity-50"
                  title="Supprimer"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload button */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`rotation-360-upload-${productId}`}
          />
          <label
            htmlFor={`rotation-360-upload-${productId}`}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed
              cursor-pointer transition
              ${
                uploading
                  ? "bg-gray-100 border-gray-300 cursor-not-allowed"
                  : "bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }
            `}
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">
              {uploading
                ? "Upload en cours..."
                : previewUrl
                ? "Remplacer l'image 360°"
                : "Uploader l'image 360°"}
            </span>
          </label>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Format accepté : .jpg, .jpeg (max 10 MB)
        </p>
      </div>
    </div>
  );
}
