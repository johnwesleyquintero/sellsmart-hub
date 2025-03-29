// Utility function to load static data from JSON files
export async function loadStaticData<T>(dataType: string): Promise<T | null> {
  try {
    // In a real implementation, this would dynamically import the JSON file
    // For now, we'll use a switch statement to handle different data types
    switch (dataType) {
      case 'projects':
        return (await import('@/data/projects.json')).default as T;
      case 'blog':
        return (await import('@/data/blog.json')).default as T;
      case 'case-studies':
        return (await import('@/data/case-studies.json')).default as T;
      case 'changelog':
        return (await import('@/data/changelog.json')).default as T;
      case 'experience':
        return (await import('@/data/experience.json')).default as T;
      default:
        console.warn(`No static data found for type: ${dataType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error loading static data for ${dataType}:`, error);
    return null;
  }
}

// Example usage:
// const projectsData = await loadStaticData<ProjectsData>('projects');
