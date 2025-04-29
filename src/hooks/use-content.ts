import { logger } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

interface ContentData {
  skills: Array<{
    name: string;
    level: number;
    icon: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string[];
    image?: string;
    link?: string;
    github?: string;
    featured: boolean;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string[];
    technologies: string[];
  }>;
}

const fetchContent = async (): Promise<ContentData> => {
  try {
    const response = await fetch('/api/content', {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    logger.error('Error fetching content:', { error });
    throw error;
  }
};

export function useContent(type: string) {
  const query = useQuery({
    queryKey: ['content', type],
    queryFn: fetchContent,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (query.error) {
      logger.error('Content fetch error:', query.error);
    }
  }, [query.error]);

  return query;
}
