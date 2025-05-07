import type { Experience, Skill } from '@/lib/types';
import { useEffect, useState } from 'react';

interface ContentResponse {
  // Defines the structure of the API response
  skills?: Skill[]; // List of skills
  projects?: unknown[]; // Replace 'any' with the actual type for projects if known
  experience?: Experience[];
}

interface UseAboutDataResult {
  // Defines the structure of the return value of the useAboutData hook
  skills: Skill[]; // List of skills
  experience: Experience[]; // List of experience items
  isLoading: boolean;
  error: string | undefined;
}

export const useAboutData = (
  // Fetches the about data from the API
  fallbackSkills: Skill[],
  fallbackExperience: Experience[],
): UseAboutDataResult => {
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills);
  const [experience, setExperience] =
    useState<Experience[]>(fallbackExperience);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchContent() {
      // Fetches the about data from the API
      try {
        const res = await fetch('/api/content', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!res.ok) {
          // Handle non-200 responses
          const errorText = await res.text();
          console.error('API Error Response:', {
            status: res.status,
            statusText: res.statusText,
            url: res.url,
            headers: Object.fromEntries(res.headers.entries()),
            error: errorText,
          });

          let errorMessage = `API request failed with status ${res.status}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) errorMessage += `: ${errorData.message}`;
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }

          throw new Error(errorMessage);
        }

        const data: ContentResponse = await res.json();

        if (data.skills && data.skills.length > 0) {
          // Set skills if available
          setSkills(data.skills);
        }

        if (data.experience && data.experience.length > 0) {
          // Set experience if available
          setExperience(data.experience);
        }
      } catch (error) {
        // Handle errors during fetch
        console.error('Error fetching content:', {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });

        setError(
          error instanceof Error
            ? `Failed to load content: ${error.message}. Using fallback data.`
            : 'Failed to load content. Using fallback data.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, []);

  return { skills, experience, isLoading, error };
};
