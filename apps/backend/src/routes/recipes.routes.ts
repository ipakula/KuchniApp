import { Router } from 'express';
import * as recipesController from '../controllers/recipes.controller';

const router = Router();

router.get('/', recipesController.getUserRecipes);
router.post('/generate', recipesController.generateRecipe);
router.post('/', recipesController.saveRecipe);
router.get('/:id', recipesController.getRecipe);
router.delete('/:id', recipesController.deleteRecipe);

export default router;
