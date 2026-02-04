"use client";

import { useState, useCallback, useRef } from 'react';
import { Upload, X, RotateCw, Check, AlertCircle, ImageIcon, Eye } from 'lucide-react';
import Image from 'next/image';

interface Image360UploaderProps {
  productId?: string;
  onImagesChange?: (images: File[]) => void;
  existingImages?: Array<{ url: string; frameNumber: number }>;
  minImages?: number;
  maxImages?: number;
}

interface ImagePreview {
  file: File;
  preview: string;
  frameNumber: number;
}

export default function Image360Uploader({
  productId,
  onImagesChange,
  existingImages = [],
  minImages = 24,
  maxImages = 48,
}: Image360UploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentPreviewFrame, setCurrentPreviewFrame] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const fileArray = Array.from(files);

    // Validation
    if (fileArray.length < minImages) {
      setError(`Please select at least ${minImages} images for a 360° view`);
      return;
    }

    if (fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Vérifier que ce sont des images
    const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setError('All files must be images');
      return;
    }

    // Créer les previews
    const newImages: ImagePreview[] = fileArray.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      frameNumber: index + 1,
    }));

    setImages(newImages);
    onImagesChange?.(fileArray);
  }, [minImages, maxImages, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // Renuméroter les frames
      const renumbered = newImages.map((img, i) => ({
        ...img,
        frameNumber: i + 1,
      }));
      onImagesChange?.(renumbered.map(img => img.file));
      return renumbered;
    });
  }, [onImagesChange]);

  const clearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setError(null);
    onImagesChange?.([]);
  }, [images, onImagesChange]);

  const startPreview = useCallback(() => {
    if (images.length === 0) return;
    setIsPreviewMode(true);
    setCurrentPreviewFrame(0);

    // Animation automatique
    let frame = 0;
    previewIntervalRef.current = setInterval(() => {
      frame = (frame + 1) % images.length;
      setCurrentPreviewFrame(frame);
    }, 100); // 10 FPS
  }, [images.length]);

  const stopPreview = useCallback(() => {
    setIsPreviewMode(false);
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  }, []);

  const handleUpload = async () => {
    if (!productId || images.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      
      images.forEach((img, index) => {
        formData.append(`images`, img.file);
        formData.append(`frameNumbers`, String(img.frameNumber));
      });

      const response = await fetch('/api/admin/products/upload-360', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Upload failed');
      }

      setUploadProgress(100);
      // Success feedback
      setTimeout(() => {
        clearAll();
        setIsUploading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">360° Product Images</h3>
          <p className="text-sm text-gray-500">
            Upload {minImages}-{maxImages} images for interactive 360° view
          </p>
        </div>
        {images.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={isPreviewMode ? stopPreview : startPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {isPreviewMode ? (
                <>
                  <X className="w-4 h-4" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Preview 360°
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Upload Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {images.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop your 360° images here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse ({minImages}-{maxImages} images, JPG/PNG)
          </p>
          <button className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">
            Select Images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Preview Mode */}
      {isPreviewMode && images.length > 0 && (
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={images[currentPreviewFrame].preview}
            alt={`Frame ${currentPreviewFrame + 1}`}
            fill
            className="object-contain"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin" />
            Frame {currentPreviewFrame + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Image Grid */}
      {!isPreviewMode && images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">
              <Check className="w-4 h-4 inline text-green-600" />
              {' '}{images.length} images uploaded
              {images.length < minImages && (
                <span className="text-red-600 ml-2">
                  (minimum {minImages} required)
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-100 rounded-md overflow-hidden group"
              >
                <Image
                  src={img.preview}
                  alt={`Frame ${img.frameNumber}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removeImage(index)}
                    className="p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
                  #{img.frameNumber}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {productId && (
            <div className="mt-4">
              <button
                onClick={handleUpload}
                disabled={isUploading || images.length < minImages}
                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Upload 360° Images
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && images.length === 0 && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Current 360° Images ({existingImages.length} frames)
          </h4>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {existingImages.map((img, index) => (
              <div
                key={index}
                className="relative aspect-square bg-gray-100 rounded-md overflow-hidden"
              >
                <Image
                  src={img.url}
                  alt={`Frame ${img.frameNumber}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-0.5 text-center">
                  #{img.frameNumber}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
