import { Router } from 'express';
import { aiController } from '@controllers/ai.controller';
import { uploadMiddleware } from '@middleware/upload.middleware';
import { MAX_PRODUCTS, MAX_REFERENCES } from '@utils/file.utils';

const router = Router();

router.post(
  '/generate',
  uploadMiddleware.fields([
    { name: 'products', maxCount: MAX_PRODUCTS },
    { name: 'references', maxCount: MAX_REFERENCES },
  ]),
  aiController.generateVariations
);

export const aiRoutes = router;
