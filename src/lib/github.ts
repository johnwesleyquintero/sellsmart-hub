import { Octokit } from '@octokit/rest';
import { logger } from './logger';
import { monitor } from './monitoring';
import { Cache } from './redis';
import { rateLimiter } from './redis/config';

const cache = new Cache({ prefix: 'github:' });
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  topics: string[];
  updated_at: string;
  stargazers_count: number;
  default_branch: string;
  visibility: string;
}

interface GitHubError extends Error {
  status?: number;
  response?: Response;
}

export async function getGitHubProjects() {
  const cacheKey = 'projects';
  const cacheTTL = 3600; // Cache for 1 hour

  try {
    // Check rate limit before making request
    const { success } = await rateLimiter.limit('github-api');
    if (!success) {
      throw new Error('Rate limit exceeded for GitHub API');
    }

    return await cache.wrap(
      cacheKey,
      async () => {
        const startTime = performance.now();

        const response = await fetch(
          'https://api.github.com/users/johnwesleyquintero/repos?sort=updated&per_page=10',
          {
            headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Portfolio-App',
            },
            next: { revalidate: 3600 },
          },
        );

        if (!response.ok) {
          const error = new Error('GitHub API error') as GitHubError;
          error.status = response.status;
          error.response = response;
          throw error;
        }

        const repos: GitHubRepo[] = await response.json();

        // Transform and filter data
        const projects = repos
          .filter((repo) => repo.visibility === 'public')
          .map((repo) => ({
            id: repo.id.toString(),
            title: repo.name,
            description: repo.description || '',
            technologies: repo.topics,
            link: repo.html_url,
            stars: repo.stargazers_count,
            updatedAt: repo.updated_at,
            branch: repo.default_branch,
          }));

        const endTime = performance.now();
        monitor.trackNavigation('github-projects-fetch');

        logger.info('GitHub projects fetched successfully', {
          count: projects.length,
          duration: endTime - startTime,
        });

        return projects;
      },
      cacheTTL,
    );
  } catch (error) {
    logger.error('Error fetching GitHub projects:', {
      error,
      status: (error as GitHubError).status,
    });

    // Return empty array but track the error
    monitor.trackError(new Error('github-projects-fetch-error'), {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: (error as GitHubError).status,
    });

    return [];
  }
}

export async function getRepoContents(owner: string, repo: string) {
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '', // Root path
    });

    if ('data' in response) {
      return response.data;
    }
    return null;
  } catch (error) {
    logger.error('Failed to fetch repository contents:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch repository contents');
  }
}
