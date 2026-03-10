import React from 'react';
import { UploadedImage } from '../../types/image.types';

interface ImagePreviewProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  disabled?: boolean;
  title?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ images, onRemove, disabled = false, title }) => {
  if (images.length === 0) return null;

  return (
    <div className="mt-4">
      {title && <h3 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">{title} ({images.length})</h3>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden border border-zinc-200 shadow-sm aspect-square bg-zinc-50">
            <img 
              src={img.previewUrl} 
              alt={img.file.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-zinc-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur text-zinc-800 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm translate-y-1 group-hover:translate-y-0"
                aria-label="Remove image"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
