import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const MAX_INPUT_DIMENSION = 1024;

export const imageService = {
  // Resize image to cap the longest side, reducing token cost
  resizeForInput: async (filePath: string): Promise<Buffer> => {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width <= MAX_INPUT_DIMENSION && height <= MAX_INPUT_DIMENSION) {
      return image.toBuffer();
    }

    return image
      .resize({
        width: MAX_INPUT_DIMENSION,
        height: MAX_INPUT_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
  },

  encodeToBase64: async (filePath: string): Promise<{ dataUrl: string; width: number; height: number }> => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    
    const mimeType = mimeMap[ext] || 'image/jpeg';
    const resizedBuffer = await imageService.resizeForInput(filePath);

    const metadata = await sharp(resizedBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const base64Image = resizedBuffer.toString('base64');
    
    return {
      dataUrl: `data:${mimeType};base64,${base64Image}`,
      width,
      height,
    };
  },

  saveGeneratedImage: async (base64DataUrl: string): Promise<string> => {
    // Extract base64 data and mime type
    const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data URL');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    const ext = extMap[mimeType] || '.png';
    const fileName = `${uuidv4()}${ext}`;
    const generatedDir = path.join(process.cwd(), 'generated');
    
    await fs.mkdir(generatedDir, { recursive: true });
    
    const filePath = path.join(generatedDir, fileName);
    await fs.writeFile(filePath, buffer);

    return `/generated/${fileName}`;
  }
};
