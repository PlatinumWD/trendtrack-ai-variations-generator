import React, { useState, useCallback, useEffect } from 'react';
import { GeneratedImage } from '../../types/image.types';
import { GenerateResponseUsage } from '../../types/api.types';
import { appConfig } from '@config/app.config';

const VARIATION_LABELS = ['TOFU', 'MOFU', 'BOFU', 'Creative mix'] as const;

interface ResultGalleryProps {
  images: GeneratedImage[];
  usage?: GenerateResponseUsage | null;
  model?: string | null;
}

export const ResultGallery: React.FC<ResultGalleryProps> = ({ images, usage, model }) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${appConfig.API_BASE_URL.replace('/api', '')}${url}`;
  };

  const formatCost = (cost: number) => (cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`);

  const handlePrev = useCallback(() => {
    if (modalIndex === null) return;
    setModalIndex(modalIndex === 0 ? images.length - 1 : modalIndex - 1);
  }, [modalIndex, images.length]);

  const handleNext = useCallback(() => {
    if (modalIndex === null) return;
    setModalIndex(modalIndex === images.length - 1 ? 0 : modalIndex + 1);
  }, [modalIndex, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalIndex === null) return;
      if (e.key === 'Escape') setModalIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalIndex, handlePrev, handleNext]);

  if (images.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b pb-2">
        <h3 className="text-2xl font-bold text-gray-800">AI Generated Variations</h3>
        <div className="flex flex-wrap items-center gap-3">
          {model && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 font-mono">
              {model}
            </span>
          )}
          {usage && (usage.total_cost > 0 || usage.prompt_tokens > 0) && (
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <span className="font-medium">Cost:</span> {formatCost(usage.total_cost)}
              {usage.prompt_tokens > 0 && (
                <span className="ml-3 text-gray-500">
                  {usage.prompt_tokens.toLocaleString()} in / {usage.completion_tokens.toLocaleString()} out tokens
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((img, index) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setModalIndex(index)}
            className="group rounded-xl overflow-hidden shadow-lg border border-gray-100 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-left transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
          >
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              <img
                src={getFullUrl(img.url)}
                alt={`Variation ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </button>
        ))}
      </div>

      {modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setModalIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setModalIndex(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 bg-black/30 rounded-full z-10"
            aria-label="Previous"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <img
            src={getFullUrl(images[modalIndex].url)}
            alt={`Variation ${modalIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 bg-black/30 rounded-full z-10"
            aria-label="Next"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {modalIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
};
