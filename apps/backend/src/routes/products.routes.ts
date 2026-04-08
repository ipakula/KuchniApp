import { Router } from 'express';
import * as productsController from '../controllers/products.controller';

const router = Router();

router.get('/search', productsController.searchProducts);
router.get('/categories', productsController.getCategories);
router.get('/barcode/:barcode', productsController.getByBarcode);
router.get('/:id', productsController.getProduct);
router.post('/', productsController.createProduct);

export default router;
