import { apiClient } from '@lib/apiClient';
import { GenerateResponse } from '../types/api.types';

export const aiService = {
  generateVariations: async (
    productFiles: File[],
    referenceFiles: File[],
    count: number = 1,
    fusion: boolean = false,
    variationIndex?: number
  ): Promise<GenerateResponse> => {
    const formData = new FormData();
    productFiles.forEach((file) => formData.append('products', file));
    referenceFiles.forEach((file) => formData.append('references', file));
    formData.append('count', count.toString());
    formData.append('fusion', fusion.toString());
    if (variationIndex !== undefined) {
      formData.append('variationIndex', variationIndex.toString());
    }

    const response = await apiClient.post<GenerateResponse>('/ai/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
