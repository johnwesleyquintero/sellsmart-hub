import { z } from 'zod';

export const DEFAULT_COMMAND_TIMEOUT_MS = 300000;
export const DEFAULT_COMMANDS_CONFIG = [
  { id: 'format', name: 'Formatting (Prettier)', command: 'npm run format' },
  { id: 'lint', name: 'Linting (ESLint)', command: 'npm run lint' },
  { id: 'typecheck', name: 'Type Checking (TSC)', command: 'npx tsc --noEmit' },
  { id: 'build', name: 'Build Project', command: 'npm run build' },
];

const CommandCheckSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  command: z.string().min(1),
  timeout: z.number().positive().optional(),
});

const ErrorCategorySchema = z.object({
  patterns: z.array(z.string().min(1)).min(1),
  suggestion: z.string().optional(),
});

export const ConfigSchema = z.object({
  runInParallel: z.boolean().default(false),
  stopOnFail: z.boolean().default(false),
  commandTimeout: z.number().positive().default(DEFAULT_COMMAND_TIMEOUT_MS),
  checks: z.array(CommandCheckSchema).min(1).default(DEFAULT_COMMANDS_CONFIG),
  errorCategories: z.record(ErrorCategorySchema).default({}),
});
