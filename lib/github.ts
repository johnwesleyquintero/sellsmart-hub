// Update the GitHub API function to properly use environment variables
export async function getGitHubProjects() {
  // Temporarily returning mock data while GitHub integration is disabled
  return [
    {
      "title": "Nebula-Singularity: SellSmart",
      "image": "/images/NS-SellSmart-preview.svg",
      "description": "AI-powered Amazon analytics dashboard with real-time PPC optimization",
      "tags": ["React", "Node.js", "AI", "Analytics"],
      "liveUrl": "https://sellsmart-hub.vercel.app/",
      "githubUrl": "https://github.com/johnwesleyquintero/sellsmart"
    },
    {
      "title": "Portfolio Website",
      "image": "/public/portfolio-preview.svg",
      "description": "A modern, responsive portfolio website showcasing my skills, projects, and professional experience as a Data-Driven Amazon & E-commerce Specialist with Amazon Free Tools embedded.",
      "tags": ["Next.js", "TypeScript", "React", "Tailwind CSS"],
      "liveUrl": "https://wesleyquintero.vercel.app/",
      "githubUrl": "https://github.com/johnwesleyquintero/portfolio"
    },
    {
      "title": "DevFlowDB",
      "image": "/public/database.svg",
      "description": "The Developer-Centric Database Solution",
      "tags": ["Node.js 18+", "React 18 + Vite", "Tailwind CSS 3", "Supabase"],
      "liveUrl": "DevFlowDB.vercel.app",
      "githubUrl": "https://github.com/johnwesleyquintero/DevFlowDB"
    }
  ];
}

function getCategoryFromTopics(topics: string[]) {
  if (topics.includes("frontend")) return "frontend";
  if (topics.includes("backend")) return "backend";
  if (topics.includes("fullstack")) return "fullstack";
  if (topics.includes("data")) return "data";
  return "fullstack";
}

