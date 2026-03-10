import React, { useState, useCallback, useEffect } from 'react';
import { GeneratedImage } from '../../types/image.types';
import { GenerateResponseUsage } from '../../types/api.types';
import { appConfig } from '@config/app.config';

interface ResultGalleryProps {
  images: GeneratedImage[];
  usage?: GenerateResponseUsage | null;
  model?: string | null;
  onRegenerate?: (index: number) => void;
  regeneratingIndex?: number | null;
  disabled?: boolean;
}

export const ResultGallery: React.FC<ResultGalleryProps> = ({
  images,
  usage,
  model,
  onRegenerate,
  regeneratingIndex = null,
  disabled = false,
}) => {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${appConfig.API_BASE_URL.replace('/api', '')}${url}`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return '$0.00';
    return cost < 0.0001 ? `< $0.0001` : `$${cost.toFixed(4)}`;
  };

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

  const handleDownload = useCallback(
    (url: string, filename: string) => {
      const fullUrl = getFullUrl(url);
      fetch(fullUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.click();
          URL.revokeObjectURL(a.href);
        });
    },
    []
  );

  const handleDownloadAll = useCallback(() => {
    images.forEach((img, i) => {
      const filename = `variation-${i + 1}.png`;
      setTimeout(() => handleDownload(img.url, filename), i * 200);
    });
  }, [images, handleDownload]);

  const handleRegenerateClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (!disabled && onRegenerate) onRegenerate(index);
    },
    [disabled, onRegenerate]
  );

  if (images.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">Generated Creations</h3>
          <p className="text-zinc-500 text-sm mt-1">High-quality variations ready for your campaigns</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-900 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
          {model && (
            <span className="hidden md:inline-flex text-xs text-zinc-500 bg-zinc-100 px-3 py-2 rounded-lg font-mono border border-zinc-200/60">
              {model}
            </span>
          )}
          {usage && (usage.total_cost > 0 || usage.prompt_tokens > 0) && (
            <div className="hidden lg:flex items-center text-xs bg-white rounded-lg border border-zinc-200/60 shadow-sm overflow-hidden">
              <div className="px-3 py-2 bg-zinc-50 border-r border-zinc-200/60 text-zinc-700 font-semibold">
                Cost: {formatCost(usage.total_cost)}
              </div>
              {usage.prompt_tokens > 0 && (
                <div className="px-3 py-2 text-zinc-500 flex items-center gap-2">
                  <span title="Input tokens" className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    {usage.prompt_tokens.toLocaleString()}
                  </span>
                  <span className="w-px h-3 bg-zinc-300"></span>
                  <span title="Output tokens" className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                    {usage.completion_tokens.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="group rounded-2xl overflow-hidden shadow-sm border border-zinc-200/80 bg-zinc-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => setModalIndex(index)}
              onKeyDown={(e) => e.key === 'Enter' && setModalIndex(index)}
              className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-inset"
            >
              <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                <img
                  src={getFullUrl(img.url)}
                  alt={`Variation ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/20 transition-colors duration-300" />
                
                {/* Action Buttons Container */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <button
                    type="button"
                    onClick={(e) => handleRegenerateClick(e, index)}
                    disabled={disabled || regeneratingIndex === index}
                    title="Regenerate"
                    className="p-2.5 rounded-full bg-white/95 backdrop-blur-sm text-zinc-800 hover:bg-white hover:text-black shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {regeneratingIndex === index ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(img.url, `variation-${index + 1}.png`);
                    }}
                    title="Download"
                    className="p-2.5 rounded-full bg-white/95 backdrop-blur-sm text-zinc-800 hover:bg-white hover:text-black shadow-lg hover:shadow-xl transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm transition-opacity"
          onClick={() => setModalIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 to-transparent pointer-events-none" />
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setModalIndex(null); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-4 rounded-full hover:bg-white/10 transition-colors z-10 hidden sm:block"
            aria-label="Previous"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            src={getFullUrl(images[modalIndex].url)}
            alt={`Variation ${modalIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-md shadow-2xl z-10 relative"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-4 rounded-full hover:bg-white/10 transition-colors z-10 hidden sm:block"
            aria-label="Next"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium tracking-widest uppercase z-10 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
            {modalIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};
