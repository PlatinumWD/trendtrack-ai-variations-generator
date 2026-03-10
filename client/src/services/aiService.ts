import { apiClient } from '@lib/apiClient';
import { GenerateResponse } from '../types/api.types';

export const aiService = {
  generateVariations: async (files: File[], count: number = 1): Promise<GenerateResponse> => {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('count', count.toString());

    const response = await apiClient.post<GenerateResponse>('/ai/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
};
