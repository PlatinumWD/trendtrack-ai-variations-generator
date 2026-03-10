import { useState } from 'react';
import { ImageUploader } from '@components/ImageUploader/ImageUploader';
import { ImagePreview } from '@components/ImagePreview/ImagePreview';
import { ResultGallery } from '@components/ResultGallery/ResultGallery';
import { Loader } from '@components/Loader/Loader';
import { Sidebar } from '@components/Sidebar/Sidebar';
import { useImageUpload } from '@hooks/useImageUpload';
import { useAIProcessing } from '@hooks/useAIProcessing';

export const Home: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [variationCount, setVariationCount] = useState<number>(1);
  const [fusionEnabled, setFusionEnabled] = useState<boolean>(false);
  const products = useImageUpload(10);
  const references = useImageUpload(10);
  const { isLoading, generatedImages, usage, model, error: aiError, generate, regenerateSingle, replaceImageAtIndex } = useAIProcessing();
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const handleGenerate = () => {
    if (products.images.length === 0) return;
    generate(
      products.images.map((i) => i.file),
      references.images.map((i) => i.file),
      variationCount,
      fusionEnabled
    );
  };

  const canGenerate = products.images.length > 0;

  const handleRegenerate = async (index: number) => {
    if (products.images.length === 0) return;
    setRegeneratingIndex(index);
    try {
      const newImage = await regenerateSingle(
        products.images.map((i) => i.file),
        references.images.map((i) => i.file),
        fusionEnabled,
        index
      );
      if (newImage) replaceImageAtIndex(index, newImage);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out lg:ml-64">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-zinc-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between lg:justify-end">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="text-sm font-medium text-zinc-500">
              Professional Studio
            </div>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <header className="mb-12 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500">Creative Variations</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
            Upload your product images and optionally provide references to guide the AI's artistic direction. Perfect for testing new ad creatives instantly.
          </p>
        </header>

        <main className="bg-white rounded-3xl shadow-sm border border-zinc-200/60 p-6 sm:p-10 overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-zinc-900/[0.02] blur-3xl rounded-full pointer-events-none"></div>

          <div className="space-y-10 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Products Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Product Assets <span className="text-red-500">*</span></h2>
                  <p className="text-sm text-zinc-500 mb-3">Upload the main products to feature.</p>
                </div>
                <ImageUploader
                  onFilesSelected={products.addImages}
                  disabled={isLoading}
                  label="Drop product images"
                  hint="Max 10 images, up to 10MB"
                />
                {products.error && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">{products.error}</div>
                )}
                <ImagePreview
                  images={products.images}
                  onRemove={products.removeImage}
                  disabled={isLoading}
                  title="Uploaded Products"
                />
              </div>

              {/* References Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Creative References</h2>
                  <p className="text-sm text-zinc-500 mb-3">Optional. Guide the AI's mood and composition.</p>
                </div>
                <ImageUploader
                  onFilesSelected={references.addImages}
                  disabled={isLoading}
                  label="Drop reference ads"
                  hint="Max 10 images, up to 10MB"
                />
                {references.error && (
                  <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">{references.error}</div>
                )}
                <ImagePreview
                  images={references.images}
                  onRemove={references.removeImage}
                  disabled={isLoading}
                  title="Uploaded References"
                />
              </div>
            </div>

            {/* AI Settings & Generation */}
            {canGenerate && (
              <div className="pt-8 border-t border-zinc-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={fusionEnabled}
                          onChange={(e) => setFusionEnabled(e.target.checked)}
                          disabled={isLoading}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${fusionEnabled ? 'bg-zinc-900' : 'bg-zinc-200'}`}></div>
                        <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${fusionEnabled ? 'translate-x-5' : 'translate-x-0'} shadow-sm`}></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-zinc-900 block group-hover:text-zinc-700 transition-colors">Smart Product Fusion</span>
                        <span className="text-xs text-zinc-500">Creatively merge multiple products</span>
                      </div>
                    </label>

                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-zinc-900">Variations per run</span>
                      <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => setVariationCount(num)}
                            disabled={isLoading}
                            className={`w-10 h-8 rounded-md text-sm font-medium transition-all ${
                              variationCount === num 
                                ? 'bg-zinc-900 text-white shadow-md' 
                                : 'text-zinc-600 hover:bg-zinc-50'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={`relative overflow-hidden group px-8 py-4 rounded-xl text-white font-bold text-base shadow-lg transition-all ${
                      isLoading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800 hover:shadow-xl active:scale-[0.98]'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          Generate Creations
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {aiError && (
            <div className="mt-8 p-4 bg-red-50/50 text-red-800 rounded-2xl text-center font-medium border border-red-100/50 flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {aiError}
            </div>
          )}

          {isLoading && (
            <div className="mt-12 mb-4">
              <Loader />
            </div>
          )}
        </main>
        
            {!isLoading && generatedImages.length > 0 && (
              <div className="mt-12">
                <ResultGallery
                  images={generatedImages}
                  usage={usage}
                  model={model}
                  onRegenerate={handleRegenerate}
                  regeneratingIndex={regeneratingIndex}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
