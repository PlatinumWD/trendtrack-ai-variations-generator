import { useState, useCallback } from 'react';
import { aiService } from '@services/aiService';
import { GeneratedImage } from '../types/image.types';
import { GenerateResponseUsage } from '../types/api.types';
import { v4 as uuidv4 } from 'uuid';

export const useAIProcessing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [usage, setUsage] = useState<GenerateResponseUsage | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (productFiles: File[], referenceFiles: File[], count: number = 1, fusion: boolean = false, visualDirection: string = 'marketing') => {
    if (!productFiles?.length) return;

    setIsLoading(true);
    setError(null);
    setUsage(null);
    setModel(null);

    try {
      const data = await aiService.generateVariations(productFiles, referenceFiles, count, fusion, undefined, visualDirection);
      const newImages = data.generatedImages.map((url) => ({
        id: uuidv4(),
        url,
      }));
      setGeneratedImages(newImages);
      if (data.usage) setUsage(data.usage);
      if (data.model) setModel(data.model);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to generate images.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const regenerateSingle = useCallback(
    async (
      productFiles: File[],
      referenceFiles: File[],
      fusion: boolean,
      index: number,
      visualDirection: string = 'marketing'
    ): Promise<GeneratedImage | null> => {
      if (!productFiles?.length) return null;

      try {
        const data = await aiService.generateVariations(
          productFiles,
          referenceFiles,
          1,
          fusion,
          index % 4,
          visualDirection
        );
        if (!data.generatedImages?.length) return null;
        return { id: uuidv4(), url: data.generatedImages[0] };
      } catch {
        return null;
      }
    },
    []
  );

  const replaceImageAtIndex = useCallback((index: number, image: GeneratedImage) => {
    setGeneratedImages((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      next[index] = image;
      return next;
    });
  }, []);

  const clearResults = useCallback(() => {
    setGeneratedImages([]);
    setUsage(null);
    setModel(null);
    setError(null);
  }, []);

  return {
    isLoading,
    generatedImages,
    usage,
    model,
    error,
    generate,
    regenerateSingle,
    replaceImageAtIndex,
    clearResults,
  };
};
