import { z } from 'zod';
import { CATEGORY_COLOR_RE } from '@/lib/finance/categories';

/** Cor da categoria: hex de 6 dígitos, ex.: "#10b981" (POST e PATCH /categories). */
export const categoryColorSchema = z.string().regex(CATEGORY_COLOR_RE);
