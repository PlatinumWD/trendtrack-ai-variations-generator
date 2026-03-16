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
      const visualDirection = req.body.visualDirection || 'marketing';
      const aspectRatio = req.body.aspectRatio || '1:1';
      const userContext = typeof req.body.userContext === 'string' ? req.body.userContext.trim() : undefined;
      const variationIndexStr = req.body.variationIndex;
      const variationIndex = variationIndexStr !== undefined && variationIndexStr !== ''
        ? Math.max(0, Math.min(3, parseInt(variationIndexStr, 10)))
        : undefined;

      if (productFiles.length === 0) {
        return res.status(400).json({ error: 'At least one product image is required' });
      }

      const allInputFiles = [...productFiles, ...referenceFiles];
      const encodeResults = await Promise.all(
        allInputFiles.map((file) => imageService.encodeToBase64(file.path))
      );

      const productBase64 = encodeResults.slice(0, productFiles.length).map((r) => r.dataUrl);
      const referenceBase64 = encodeResults.slice(productFiles.length).map((r) => r.dataUrl);
      const maxDimension = encodeResults.reduce(
        (max, r) => Math.max(max, r.width, r.height),
        0
      );

      const effectiveCount = variationIndex !== undefined ? 1 : count;
      const { images: generatedBase64DataUrls, model, usage } = await openrouterService.generateVariations(
        productBase64,
        referenceBase64,
        effectiveCount,
        maxDimension,
        fusion,
        variationIndex,
        visualDirection,
        userContext,
        aspectRatio
      );

      const savedImageUrls = await Promise.all(
        generatedBase64DataUrls.map((base64DataUrl) =>
          imageService.saveGeneratedImage(base64DataUrl)
        )
      );

      await Promise.allSettled(
        allInputFiles.map((file) =>
          fs.unlink(file.path).catch((err) => {
            console.error(`Failed to delete temporary file ${file.path}:`, err);
          })
        )
      );

      res.status(200).json({ generatedImages: savedImageUrls, model, usage });
    } catch (error) {
      next(error);
    }
  }
};
