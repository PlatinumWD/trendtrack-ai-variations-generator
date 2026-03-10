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

      if (productFiles.length === 0 || referenceFiles.length === 0) {
        return res.status(400).json({ error: 'Both products and references are required' });
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

      const { images: generatedBase64DataUrls, model, usage } = await openrouterService.generateVariations(
        productBase64,
        referenceBase64,
        count,
        maxDimension,
        fusion
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
