import { useState } from 'react';
import { ImageUploader } from '@components/ImageUploader/ImageUploader';
import { ImagePreview } from '@components/ImagePreview/ImagePreview';
import { ResultGallery } from '@components/ResultGallery/ResultGallery';
import { Loader } from '@components/Loader/Loader';
import { useImageUpload } from '@hooks/useImageUpload';
import { useAIProcessing } from '@hooks/useAIProcessing';

export const Home: React.FC = () => {
  const [variationCount, setVariationCount] = useState<number>(1);
  const { images, error: uploadError, addImages, removeImage } = useImageUpload();
  const { isLoading, generatedImages, usage, model, error: aiError, generate } = useAIProcessing();

  const handleGenerate = () => {
    if (images.length === 0) return;
    const files = images.map(img => img.file);
    generate(files, variationCount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            AI Product Variations
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your product images and let our AI generate stunning lifestyle composites and variations instantly.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          
          <ImageUploader onFilesSelected={addImages} disabled={isLoading} />
          
          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {uploadError}
            </div>
          )}

          <ImagePreview images={images} onRemove={removeImage} disabled={isLoading} />

          {images.length > 0 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <label htmlFor="variationCount" className="text-sm font-medium text-gray-700">
                  Number of variations:
                </label>
                <input
                  id="variationCount"
                  type="number"
                  min="1"
                  value={variationCount}
                  onChange={(e) => setVariationCount(Math.min(99999, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={isLoading}
                  className="w-16 p-1 text-center border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`px-8 py-3 rounded-full text-white font-bold text-lg shadow-md transition-all ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                }`}
              >
                {isLoading ? 'Processing...' : 'Generate AI Variations'}
              </button>
            </div>
          )}

          {aiError && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-center font-medium border border-red-200">
              {aiError}
            </div>
          )}

          {isLoading && (
            <div className="mt-10">
              <Loader />
            </div>
          )}

          {!isLoading && <ResultGallery images={generatedImages} usage={usage} model={model} />}

        </main>

      </div>
    </div>
  );
};
