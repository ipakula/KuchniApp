import { Router } from 'express';
import * as pantryController from '../controllers/pantry.controller';

const router = Router();

router.get('/', pantryController.getItems);
router.get('/expiring', pantryController.getExpiring);
router.get('/stats', pantryController.getStats);
router.get('/history', pantryController.getHistory);
router.get('/:id', pantryController.getItem);
router.post('/', pantryController.addItem);
router.patch('/:id', pantryController.updateItem);
router.delete('/:id', pantryController.deleteItem);
router.post('/:id/consume', pantryController.consumeItem);
router.post('/:id/open', pantryController.openItem);
router.post('/:id/discard', pantryController.discardItem);

export default router;
