import { z } from 'zod';
import {
  dateOnlySchema,
  moneySchema,
  nonNegativeMoneySchema,
} from '@/lib/api-validation';

/**
 * Body de PATCH /goals/:id: só os campos enviados mudam; deadline null remove o prazo.
 * Estrito para que um campo com nome errado dê 400 em vez de ser ignorado.
 * currentAmount pode passar do targetAmount, como no aporte.
 */
export const goalPatchSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(100).optional(),
    targetAmount: moneySchema.optional(),
    currentAmount: nonNegativeMoneySchema.optional(),
    deadline: dateOnlySchema.nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Empty body',
  });
