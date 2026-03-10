import React from 'react';
import { UploadedImage } from '../../types/image.types';

interface ImagePreviewProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ images, onRemove, disabled = false }) => {
  if (images.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Images ({images.length})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm aspect-square bg-gray-50">
            <img 
              src={img.previewUrl} 
              alt={img.file.name} 
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <button
                onClick={() => onRemove(img.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
