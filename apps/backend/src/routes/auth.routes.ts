import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Chronione — wymaga Firebase tokenu
router.use(authMiddleware);

router.post('/register', authController.register);
router.get('/me', authController.getMe);
router.patch('/me', authController.updateMe);
router.delete('/me', authController.deleteMe);
router.post('/push-token', authController.savePushToken);
router.get('/locations', authController.getLocations);
router.get('/basic-products', authController.getBasicProducts);

export default router;
