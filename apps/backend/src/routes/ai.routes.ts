import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';

const router = Router();

router.post('/suggest-category', aiController.suggestCategory);
router.post('/suggest-expiration', aiController.suggestExpiration);
router.get('/analyze-pantry', aiController.analyzePantry);
router.get('/shopping-suggestions', aiController.shoppingSuggestions);

export default router;
