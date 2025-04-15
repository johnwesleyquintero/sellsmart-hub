var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Update the GitHub API function to properly use environment variables
export function getGitHubProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        // Temporarily returning mock data while GitHub integration is disabled
        return [
            {
                title: 'Nebula-Singularity: SellSmart',
                image: '/images/NS-SellSmart-preview.svg',
                description: 'AI-powered Amazon analytics dashboard with real-time PPC optimization',
                tags: ['React', 'Node.js', 'AI', 'Analytics'],
                liveUrl: 'https://sellsmart-hub.vercel.app/',
                githubUrl: 'https://github.com/johnwesleyquintero/sellsmart',
            },
            {
                title: 'Portfolio Website',
                image: '/public/portfolio-preview.svg',
                description: 'A modern, responsive portfolio website showcasing my skills, projects, and professional experience as a Data-Driven Amazon & E-commerce Specialist with Amazon Free Tools embedded.',
                tags: ['Next.js', 'TypeScript', 'React', 'Tailwind CSS'],
                liveUrl: 'https://wesleyquintero.vercel.app/',
                githubUrl: 'https://github.com/johnwesleyquintero/portfolio',
            },
            {
                title: 'DevFlowDB',
                image: '/public/database.svg',
                description: 'Lightweight WASM-powered SQL database with HTTPvfs integration for efficient data fetching. Handles 500+ queries/sec with <200ms latency in demo (1MB database size). Features schema versioning and browser IndexedDB caching.',
                tags: ['sql.js (WASM)', 'TypeScript', 'HTTPvfs', 'IndexedDB'],
                liveUrl: 'DevFlowDB.vercel.app',
                githubUrl: 'https://github.com/johnwesleyquintero/DevFlowDB',
            },
        ];
    });
}
