import { Response } from 'express';
import { AuthRequest } from '../types';
import * as productsService from '../services/products.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getByBarcode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const product = await productsService.findByBarcode(req.params.barcode);
    if (!product) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, product);
  } catch {
    sendError(res, 'Błąd pobierania produktu', 500);
  }
}

export async function searchProducts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) { sendSuccess(res, []); return; }
    const products = await productsService.searchProducts(q);
    sendSuccess(res, products);
  } catch {
    sendError(res, 'Błąd wyszukiwania', 500);
  }
}

export async function getProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const product = await productsService.getProduct(req.params.id);
    if (!product) { sendError(res, 'Produkt nie znaleziony', 404); return; }
    sendSuccess(res, product);
  } catch {
    sendError(res, 'Błąd pobierania produktu', 500);
  }
}

export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  try {
    const product = await productsService.createProduct(req.body);
    sendSuccess(res, product, 201);
  } catch {
    sendError(res, 'Błąd tworzenia produktu', 500);
  }
}

export async function getCategories(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const categories = await productsService.getCategories();
    sendSuccess(res, categories);
  } catch {
    sendError(res, 'Błąd pobierania kategorii', 500);
  }
}
