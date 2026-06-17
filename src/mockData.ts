import { Product, Category } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'outerwear', name: 'Outerwear', createdAt: new Date().toISOString() },
  { id: 'tops', name: 'Tops', createdAt: new Date().toISOString() },
  { id: 'bottoms', name: 'Bottoms', createdAt: new Date().toISOString() },
  { id: 'accessories', name: 'Accessories', createdAt: new Date().toISOString() }
];

export const INITIAL_PRODUCTS: Product[] = [];
