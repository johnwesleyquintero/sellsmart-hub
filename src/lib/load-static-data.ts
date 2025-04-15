import {
  BlogPost,
  CaseStudy,
  ChangelogEntry,
  Experience,
  Project,
  StaticDataTypes,
  Tool,
} from './static-data-types';

export async function loadStaticData<T extends keyof StaticDataTypes>(
  file: T,
): Promise<StaticDataTypes[T]> {
  if (file === 'projects') {
    return (await import('../data/portfolio-data/projects.json'))
      .default as Project[];
  }
  if (file === 'blog') {
    return (await import('../data/portfolio-data/blog.json'))
      .default as BlogPost[];
  }
  if (file === 'case-studies') {
    return (await import('../data/portfolio-data/case-studies.json'))
      .default as CaseStudy[];
  }
  if (file === 'changelog') {
    return (await import('../data/portfolio-data/changelog.json'))
      .default as ChangelogEntry[];
  }
  if (file === 'experience') {
    return (await import('../data/portfolio-data/experience.json'))
      .default as Experience[];
  }
  if (file === 'tools') {
    return (await import('../data/portfolio-data/tools.json'))
      .default as Tool[];
  }
  throw new Error(`Invalid file type: ${file}`);
}

// Example usage:
// const projectsData = await loadStaticData('projects');
