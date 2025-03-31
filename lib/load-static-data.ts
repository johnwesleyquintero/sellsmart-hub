// Utility function to load static data from JSON files
export async function loadStaticData<T extends Record<string, any>>(
  file: 'projects' | 'blog' | 'case-studies' | 'changelog' | 'experience',
): Promise<T> {
  if (file === 'projects') {
    return (await import('../../data/projects.json')).default as T;
  }
  if (file === 'blog') {
    return (await import('../../data/blog.json')).default as T;
  }
  if (file === 'case-studies') {
    return (await import('../../data/case-studies.json')).default as T;
  }
  if (file === 'changelog') {
    // Cast to unknown first to satisfy TypeScript conversion
    return (await import('../../data/changelog.json')).default as unknown as T;
  }
  if (file === 'experience') {
    return (await import('../../data/experience.json')).default as T;
  }
  console.warn(`No static data found for type: ${file}`);
  return null;
}

// Example usage:
// const projectsData = await loadStaticData<ProjectsData>('projects');
