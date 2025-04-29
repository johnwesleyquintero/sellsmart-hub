import skills from '@/data/portfolio-data/skills.json';
import { apiError, apiResponse, validateApiRoute } from '@/lib/api-validation';
import { getGitHubProjects } from '@/lib/github';
import { getLinkedInExperience } from '@/lib/linkedin';
import { logger } from '@/lib/logger';
import { monitor } from '@/lib/monitoring';
import { rateLimiter } from '@/lib/rate-limiter';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

// Validation schema for query parameters
const contentQuerySchema = z.object({
  include: z
    .array(z.enum(['skills', 'projects', 'experience']))
    .optional()
    .default(['skills', 'projects', 'experience']),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export async function GET(request: NextRequest) {
  return validateApiRoute(
    request,
    contentQuerySchema,
    async (validatedData) => {
      try {
        // Apply rate limiting
        const isAllowed = await rateLimiter.limit();

        if (!isAllowed) {
          return apiError('Too many requests', 429);
        }

        const startTime = performance.now();
        const include = validatedData.include ?? [
          'skills',
          'projects',
          'experience',
        ];

        // Fetch only requested data
        const results = await Promise.all([
          include.includes('projects')
            ? getGitHubProjects().then(
                (projects) => projects?.slice(0, validatedData.limit) ?? [],
              )
            : Promise.resolve([]),
          include.includes('experience')
            ? getLinkedInExperience()
            : Promise.resolve([]),
        ]);

        const [projects, experience] = results;

        // Monitor performance
        const endTime = performance.now();
        monitor.trackNavigation('/api/content');
        logger.info('Content API performance:', {
          duration: endTime - startTime,
          include,
          limit: validatedData.limit,
          projectsCount: projects.length,
          experienceCount: experience.length,
        });

        return apiResponse({
          ...(include.includes('skills') && { skills: skills.skills || [] }),
          ...(include.includes('projects') && { projects }),
          ...(include.includes('experience') && { experience }),
        });
      } catch (error) {
        logger.error('Error in content API:', { error });
        return apiError(
          error instanceof Error ? error : 'Internal server error',
        );
      }
    },
  );
}
