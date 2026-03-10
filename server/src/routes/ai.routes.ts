import { Router } from 'express';
import { aiController } from '@controllers/ai.controller';
import { uploadMiddleware } from '@middleware/upload.middleware';
import { MAX_FILES } from '@utils/file.utils';

const router = Router();

router.post(
  '/generate',
  uploadMiddleware.array('images', MAX_FILES),
  aiController.generateVariations
);

export const aiRoutes = router;
