import { Router } from 'express';
import * as shoppingController from '../controllers/shopping.controller';

const router = Router();

router.get('/', shoppingController.getList);
router.post('/', shoppingController.addItem);
router.patch('/:id', shoppingController.updateItem);
router.delete('/checked', shoppingController.clearChecked);
router.delete('/:id', shoppingController.deleteItem);
router.post('/:id/check', shoppingController.checkItem);

export default router;
