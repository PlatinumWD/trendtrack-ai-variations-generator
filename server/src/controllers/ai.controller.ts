import { Request, Response, NextFunction } from 'express';
import { imageService } from '@services/image.service';
import { openrouterService } from '@services/openrouter.service';
import fs from 'fs/promises';

export const aiController = {
  generateVariations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      const countStr = req.body.count;
      const count = countStr ? parseInt(countStr, 10) : 1;
      const promptAddition = typeof req.body.promptAddition === 'string' ? req.body.promptAddition.trim() : undefined;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      // Convert local files to base64 data URLs and track max dimension
      const base64Images: string[] = [];
      let maxDimension = 0;
      for (const file of files) {
        const { dataUrl, width, height } = await imageService.encodeToBase64(file.path);
        base64Images.push(dataUrl);
        maxDimension = Math.max(maxDimension, width, height);
      }

      // Call OpenRouter with dimension-aware output size
      const { images: generatedBase64DataUrls, model, usage } = await openrouterService.generateVariations(base64Images, promptAddition, count, maxDimension);

      // Save generated images
      const savedImageUrls: string[] = [];
      for (const base64DataUrl of generatedBase64DataUrls) {
        const relativeUrl = await imageService.saveGeneratedImage(base64DataUrl);
        savedImageUrls.push(relativeUrl);
      }

      // Cleanup uploaded files (optional, but good for space)
      for (const file of files) {
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
