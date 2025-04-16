import { StaticDataTypes } from './static-data-types';

export async function loadStaticData<T extends keyof StaticDataTypes>(
  file: T,
): Promise<StaticDataTypes[T]> {
  if (file === 'projects') {
    return (await import('../data/portfolio-data/projects.json')).default
      .projects as StaticDataTypes[T];
  }
  if (file === 'blog') {
    return (await import('../data/portfolio-data/blog.json')).default
      .posts as StaticDataTypes[T];
  }
  if (file === 'case-studies') {
    const data = await import('../data/portfolio-data/case-studies.json');
    return data.default['case-studies'] as StaticDataTypes[T];
  }
  if (file === 'changelog') {
    return (await import('../data/portfolio-data/changelog.json')).default
      .changes as StaticDataTypes[T];
  }
  if (file === 'experience') {
    return (await import('../data/portfolio-data/experience.json')).default
      .experience as StaticDataTypes[T];
  }
  if (file === 'tools') {
    return (await import('../data/portfolio-data/tools.json')).default
      .tools as StaticDataTypes[T];
  }
  throw new Error(`Invalid file type: ${file}`);
}

// Example usage:
// const projectsData = await loadStaticData('projects');
