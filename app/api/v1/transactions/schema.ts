import { z } from 'zod';
import {
  dateOnlySchema,
  moneySchema,
  monthSchema,
} from '@/lib/api-validation';

/** Body de lançamento e de edição de transação (POST /transactions e PATCH /transactions/:id). */
export const transactionBodySchema = z.object({
  description: z.string().trim().min(1).max(200),
  amount: moneySchema,
  date: dateOnlySchema, // data da compra
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1).max(50), // nome; criada se não existir
  referenceMonth: monthSchema.optional(), // competência; padrão: mês atual
});
