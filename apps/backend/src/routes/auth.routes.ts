import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { firebaseMiddleware } from '../middleware/firebase.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Rejestracja — tylko weryfikacja tokenu Firebase (user jeszcze nie istnieje w DB)
router.post('/register', firebaseMiddleware, authController.register);

// Wszystkie pozostałe trasy — pełne auth (token + user w DB)
router.use(authMiddleware);

router.get('/me', authController.getMe);
router.patch('/me', authController.updateMe);
router.delete('/me', authController.deleteMe);
router.post('/push-token', authController.savePushToken);

router.get('/locations', authController.getLocations);
router.post('/locations', authController.createLocation);
router.delete('/locations/:id', authController.deleteLocation);

router.get('/basic-products', authController.getBasicProducts);
router.post('/basic-products', authController.createBasicProduct);
router.patch('/basic-products/:id', authController.updateBasicProduct);
router.delete('/basic-products/:id', authController.deleteBasicProduct);

export default router;
