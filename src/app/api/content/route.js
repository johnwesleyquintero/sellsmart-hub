var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { NextResponse } from 'next/server';
import { getGitHubProjects } from '@/lib/github';
import { getLinkedInExperience } from '@/lib/linkedin';
import skills from '@/data/portfolio-data/skills.json';
export function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch data from GitHub and LinkedIn APIs
            const [projects, experience] = yield Promise.all([
                getGitHubProjects().catch((error) => {
                    console.error('Error fetching GitHub projects:', error);
                    return [];
                }),
                getLinkedInExperience().catch((error) => {
                    console.error('Error fetching LinkedIn experience:', error);
                    return [];
                }),
            ]);
            return NextResponse.json({
                skills: skills.skills || [],
                projects: projects || [],
                experience: experience || [],
            });
        }
        catch (error) {
            console.error('Error fetching content:', error);
            return NextResponse.json({
                error: 'Failed to fetch content',
                skills: skills.skills || [],
                projects: [],
                experience: [],
            }, { status: 500 });
        }
    });
}
