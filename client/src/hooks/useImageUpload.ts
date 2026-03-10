import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadedImage } from '../types/image.types';
import { validateImageFile } from '@utils/file.utils';

export const useImageUpload = (maxFiles: number = 4) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addImages = useCallback((files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    const newImages: UploadedImage[] = [];
    
    for (const file of fileArray) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file.');
        return;
      }

      newImages.push({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    setImages(prev => [...prev, ...newImages]);
  }, [images.length, maxFiles]);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const imgToRemove = prev.find(img => img.id === id);
      if (imgToRemove) {
        URL.revokeObjectURL(imgToRemove.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const clearImages = useCallback(() => {
    setImages(prev => {
      prev.forEach(img => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
    setError(null);
  }, []);

  return {
    images,
    error,
    addImages,
    removeImage,
    clearImages
  };
};
