import { z } from 'zod';

export const descriptionValidationSchema = z.object({
  content: z.string().min(10, {
    message: 'Description must be at least 10 characters long',
  }),
  prohibitedWords: z.array(z.string()).optional(),
  maxLength: z.number().optional(),
});

export type DescriptionValidationInput = z.infer<
  typeof descriptionValidationSchema
>;

export function validateDescription(input: DescriptionValidationInput) {
  return descriptionValidationSchema.safeParse(input);
}

export default descriptionValidationSchema;
