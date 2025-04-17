import { StaticDataTypes } from './static-data-types';
import { generateSampleCsv } from './generate-sample-csv';



// Ensure 'acos' is a valid key in StaticDataTypes
type AcosDataType = Extract<keyof StaticDataTypes, "acos">;

export async function loadStaticData<T extends keyof StaticDataTypes>(
  file: T,
): Promise<StaticDataTypes[T]> {
  if (file === 'projects') {
    return (await import('../data/portfolio-data/projects.json')).default
      .projects as unknown as StaticDataTypes[T];
  }
  if (file === 'blog') {
    const data = await import('../data/portfolio-data/blog.json');
    return data.default.posts.map((post) => ({
      ...post,
      content: post.content || '',
      relatedPosts: post.relatedPosts || [],
    })) as unknown as StaticDataTypes[T];
  }
  if (file === 'case-studies') {
    const data = await import('../data/portfolio-data/case-studies.json');
    return data.default.studies as unknown as StaticDataTypes[T];
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

  if (file === ('acos' as T)) { // Properly assert type for generic comparison
    const csv = generateSampleCsv('acos');
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map((line) => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        let value = values[index];
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (header === 'adSpend' || header === 'sales' || header === 'clicks' || header === 'impressions') {
          const parsedValue = parseFloat(value);
          return { ...obj, [header]: isNaN(parsedValue) ? 0 : parsedValue };
        } else {
          return { ...obj, [header]: value };
        }
      }, {});
    });


    return data as StaticDataTypes[AcosDataType];
  }

  throw new Error(`Invalid file type: ${file}`);
}

// Example usage:
// const projectsData = await loadStaticData('projects');
