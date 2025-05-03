import { z } from 'zod';

const envSchema = z.object({
  // Redis configuration
  REDIS_URL: z.string().url(),
  REDIS_TOKEN: z.string().min(1),

  // API Tokens
  GITHUB_TOKEN: z.string().min(1),

  // Auth configuration
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),

  // Analytics (optional)
  NEXT_PUBLIC_ANALYTICS_ENDPOINT: z.string().url().optional(),

  // Cache Prune Interval (optional)
  CACHE_PRUNE_INTERVAL: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => err.path.join('.'))
        .join(', ');
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}. Please check your .env file.`,
      );
    }
    throw error;
  }
}

// Type-safe environment object
export const env = validateEnv();

export const siteConfig = {
  name: 'Wesley Quintero',
  title: 'Data Analytics Innovator',
  description:
    'Building tools that streamline workflows and provide valuable insights.',
  url: 'https://wesleyquintero.dev',
  links: {
    github: 'https://github.com/johnwesleyquintero',
    linkedin: 'https://linkedin.com/in/wesleyquintero',
    twitter: 'https://twitter.com/wesleyquintero',
    email: 'johnwesleyquintero@gmail.com',
  },
};
