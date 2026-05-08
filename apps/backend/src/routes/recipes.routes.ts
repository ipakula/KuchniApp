import { Router } from 'express';
import * as recipesController from '../controllers/recipes.controller';

const router = Router();

router.get('/', recipesController.getUserRecipes);
router.post('/generate', recipesController.generateRecipe);
router.post('/import-url', recipesController.importRecipeFromUrl);
router.post('/', recipesController.saveRecipe);
router.get('/:id', recipesController.getRecipe);
router.patch('/:id/tags', recipesController.updateRecipeTags);
router.delete('/:id', recipesController.deleteRecipe);

export default router;
