// Update the GitHub API function to properly use environment variables
export async function getGitHubProjects() {
  // Temporarily returning mock data while GitHub integration is disabled
  return [
    {
      title: 'Nebula-Singularity: SellSmart',
      image: '/images/NS-SellSmart-preview.svg',
      description:
        'AI-powered Amazon analytics dashboard with real-time PPC optimization',
      tags: ['React', 'Node.js', 'AI', 'Analytics'],
      liveUrl: 'https://sellsmart-hub.vercel.app/',
      githubUrl: 'https://github.com/johnwesleyquintero/sellsmart',
    },
    {
      title: 'Portfolio Website',
      image: '/src/public/portfolio-preview.svg',
      description:
        'A modern, responsive portfolio website showcasing my skills, projects, and professional experience as a Data-Driven Amazon & E-commerce Specialist with Amazon Free Tools embedded.',
      tags: ['Next.js', 'TypeScript', 'React', 'Tailwind CSS'],
      liveUrl: 'https://wesleyquintero.vercel.app/',
      githubUrl: 'https://github.com/johnwesleyquintero/portfolio',
    },
    {
      title: 'DevFlowDB',
      image: '/src/public/database.svg',
      description:
        'Lightweight WASM-powered SQL database with HTTPvfs integration for efficient data fetching. Handles 500+ queries/sec with <200ms latency in demo (1MB database size). Features schema versioning and browser IndexedDB caching.',
      tags: ['sql.js (WASM)', 'TypeScript', 'HTTPvfs', 'IndexedDB'],
      liveUrl: 'DevFlowDB.vercel.app',
      githubUrl: 'https://github.com/johnwesleyquintero/DevFlowDB',
    },
  ];
}
