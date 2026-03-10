import { Request, Response, NextFunction } from 'express';
import { imageService } from '@services/image.service';
import { openrouterService } from '@services/openrouter.service';
import fs from 'fs/promises';

export const aiController = {
  generateVariations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { products?: Express.Multer.File[]; references?: Express.Multer.File[] };
      const productFiles = files?.products ?? [];
      const referenceFiles = files?.references ?? [];
      const countStr = req.body.count;
      const count = countStr ? parseInt(countStr, 10) : 1;
      const fusion = req.body.fusion === 'true';
      const variationIndexStr = req.body.variationIndex;
      const variationIndex = variationIndexStr !== undefined && variationIndexStr !== ''
        ? Math.max(0, Math.min(3, parseInt(variationIndexStr, 10)))
        : undefined;

      if (productFiles.length === 0) {
        return res.status(400).json({ error: 'At least one product image is required' });
      }

      const productBase64: string[] = [];
      const referenceBase64: string[] = [];
      let maxDimension = 0;

      for (const file of productFiles) {
        const { dataUrl, width, height } = await imageService.encodeToBase64(file.path);
        productBase64.push(dataUrl);
        maxDimension = Math.max(maxDimension, width, height);
      }
      for (const file of referenceFiles) {
        const { dataUrl, width, height } = await imageService.encodeToBase64(file.path);
        referenceBase64.push(dataUrl);
        maxDimension = Math.max(maxDimension, width, height);
      }

      const effectiveCount = variationIndex !== undefined ? 1 : count;
      const { images: generatedBase64DataUrls, model, usage } = await openrouterService.generateVariations(
        productBase64,
        referenceBase64,
        effectiveCount,
        maxDimension,
        fusion,
        variationIndex
      );

      const savedImageUrls: string[] = [];
      for (const base64DataUrl of generatedBase64DataUrls) {
        const relativeUrl = await imageService.saveGeneratedImage(base64DataUrl);
        savedImageUrls.push(relativeUrl);
      }

      const allFiles = [...productFiles, ...referenceFiles];
      for (const file of allFiles) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error(`Failed to delete temporary file ${file.path}:`, err);
        }
      }

      res.status(200).json({ generatedImages: savedImageUrls, model, usage });
    } catch (error) {
      next(error);
    }
  }
};
