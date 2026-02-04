"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, ChevronLeft, ChevronRight, Trash2, Eye, EyeOff, Save } from 'lucide-react';
import Image from 'next/image';

interface Image360SliderUploaderProps {
  productId: string;
  existingFrames?: number;
}

interface FrameData {
  frameNumber: number;
  file?: File;
  preview: string;
  isExisting: boolean;
}

export default function Image360SliderUploader({
  productId,
  existingFrames = 0,
}: Image360SliderUploaderProps) {
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les frames existantes au montage
  useEffect(() => {
    if (existingFrames > 0) {
      const existingFrameData: FrameData[] = Array.from({ length: existingFrames }, (_, i) => ({
        frameNumber: i + 1,
        preview: `/uploads/products/${productId}/360/img${i + 1}.jpg`,
        isExisting: true,
      }));
      setFrames(existingFrameData);
    }
  }, [productId, existingFrames]);

  const handleFileSelect = useCallback((files: FileList | null, startFrame = 1) => {
    if (!files || files.length === 0) return;

    setError(null);
    const fileArray = Array.from(files);

    // Créer les nouveaux frames
    const newFrames: FrameData[] = fileArray.map((file, index) => ({
      frameNumber: startFrame + index,
      file,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setFrames(prev => {
      // Fusionner avec les frames existantes
      const merged = [...prev];
      newFrames.forEach(newFrame => {
        const existingIndex = merged.findIndex(f => f.frameNumber === newFrame.frameNumber);
        if (existingIndex >= 0) {
          // Remplacer la frame existante
          if (!merged[existingIndex].isExisting) {
            URL.revokeObjectURL(merged[existingIndex].preview);
          }
          merged[existingIndex] = newFrame;
        } else {
          // Ajouter la nouvelle frame
          merged.push(newFrame);
        }
      });
      // Trier par numéro de frame
      return merged.sort((a, b) => a.frameNumber - b.frameNumber);
    });

    setSuccess(`${fileArray.length} image(s) ajoutée(s)`);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files, currentFrame + 1);
  }, [handleFileSelect, currentFrame]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFrame = useCallback((frameNumber: number) => {
    setFrames(prev => {
      const frame = prev.find(f => f.frameNumber === frameNumber);
      if (frame && !frame.isExisting) {
        URL.revokeObjectURL(frame.preview);
      }
      return prev.filter(f => f.frameNumber !== frameNumber);
    });
  }, []);

  const clearAll = useCallback(() => {
    frames.forEach(frame => {
      if (!frame.isExisting) {
        URL.revokeObjectURL(frame.preview);
      }
    });
    setFrames([]);
    setCurrentFrame(0);
    setError(null);
    setSuccess(null);
  }, [frames]);

  const nextFrame = useCallback(() => {
    setCurrentFrame(prev => (prev + 1) % frames.length);
  }, [frames.length]);

  const prevFrame = useCallback(() => {
    setCurrentFrame(prev => (prev - 1 + frames.length) % frames.length);
  }, [frames.length]);

  const startPlaying = useCallback(() => {
    if (frames.length === 0) return;
    setIsPlaying(true);
    playIntervalRef.current = setInterval(nextFrame, 100); // 10 FPS
  }, [frames.length, nextFrame]);

  const stopPlaying = useCallback(() => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  const handleUpload = async () => {
    const newFrames = frames.filter(f => !f.isExisting && f.file);
    if (newFrames.length === 0) {
      setError("Aucune nouvelle image à uploader");
      return;
    }

    setUploadProgress(0);
    setError(null);

    try {
      // Uploader frame par frame ou par batch
      for (let i = 0; i < newFrames.length; i++) {
        const frame = newFrames[i];
        const formData = new FormData();
        formData.append("files", frame.file!);
        formData.append("frameNumber", String(frame.frameNumber));

        const token = localStorage.getItem("adminToken");
        const response = await fetch(`/api/admin/products/${productId}/upload-360`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Upload failed");
        }

        setUploadProgress(Math.round(((i + 1) / newFrames.length) * 100));
      }

      setSuccess(`${newFrames.length} frame(s) uploadée(s) avec succès`);
      
      // Marquer les frames comme existantes
      setFrames(prev => prev.map(f => ({
        ...f,
        isExisting: true,
      })));

      setTimeout(() => {
        setUploadProgress(null);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer toutes les images 360° ?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/products/${productId}/upload-360`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Delete failed");
      }

      clearAll();
      setSuccess("Toutes les images 360° ont été supprimées");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const currentFrameData = frames[currentFrame];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestion des Images 360°</h3>
          <p className="text-sm text-gray-500">
            Uploadez plusieurs images pour créer une vue à 360°
          </p>
        </div>
        <div className="flex gap-2">
          {frames.length > 0 && (
            <>
              <button
                onClick={isPlaying ? stopPlaying : startPlaying}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Prévisualiser
                  </>
                )}
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Tout supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Viewer avec Slider */}
      {frames.length > 0 && currentFrameData ? (
        <div className="space-y-4">
          {/* Image viewer */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={currentFrameData.preview}
              alt={`Frame ${currentFrameData.frameNumber}`}
              fill
              className="object-contain"
              unoptimized={!currentFrameData.isExisting}
            />
            <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm">
              Frame {currentFrame + 1} / {frames.length}
            </div>
            {!currentFrameData.isExisting && (
              <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-md text-sm">
                Non uploadée
              </div>
            )}
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={frames.length - 1}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentFrame / (frames.length - 1)) * 100}%, #e5e7eb ${(currentFrame / (frames.length - 1)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={prevFrame}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Frame {currentFrameData.frameNumber}
              </span>
              <button
                onClick={nextFrame}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => removeFrame(currentFrameData.frameNumber)}
                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Drop zone vide */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            Glissez-déposez vos images ici ou cliquez pour sélectionner
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Formats acceptés: JPG, JPEG, PNG
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sélectionner les images
          </button>
        </div>
      )}

      {/* Upload controls */}
      <div className="flex gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Ajouter des images
        </button>
        {frames.some(f => !f.isExisting) && (
          <button
            onClick={handleUpload}
            disabled={uploadProgress !== null}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {uploadProgress !== null ? `Upload ${uploadProgress}%` : 'Sauvegarder'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {uploadProgress !== null && (
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-600 h-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        multiple
        onChange={(e) => handleFileSelect(e.target.files, frames.length + 1)}
        className="hidden"
      />

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
