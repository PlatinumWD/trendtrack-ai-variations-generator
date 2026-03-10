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

  const generate = useCallback(async (productFiles: File[], referenceFiles: File[], count: number = 1, fusion: boolean = false) => {
    if (!productFiles?.length || !referenceFiles?.length) return;

    setIsLoading(true);
    setError(null);
    setUsage(null);
    setModel(null);

    try {
      const data = await aiService.generateVariations(productFiles, referenceFiles, count, fusion);
      const newImages = data.generatedImages.map(url => ({
        id: uuidv4(),
        url
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
    clearResults
  };
};
