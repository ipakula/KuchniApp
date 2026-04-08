import { Router } from 'express';
import * as mealPlansController from '../controllers/meal-plans.controller';

const router = Router();

router.get('/', mealPlansController.getMealPlan);
router.get('/missing-ingredients', mealPlansController.getMissingIngredients);
router.post('/entries', mealPlansController.addEntry);
router.delete('/entries/:id', mealPlansController.deleteEntry);
router.post('/entries/:id/cook', mealPlansController.markCooked);

export default router;
