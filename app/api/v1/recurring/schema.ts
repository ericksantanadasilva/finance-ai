import { z } from 'zod';
import { moneySchema, monthSchema } from '@/lib/api-validation';

/** Body de criação de recorrência (POST /recurring). */
export const recurringBodySchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount: moneySchema,
  type: z.enum(['income', 'expense']),
  category: z.string().trim().max(50).optional(), // vazio ou ausente = sem categoria
  dayOfMonth: z.number().int().min(1).max(31), // meses curtos usam o último dia
  startMonth: monthSchema,
});
