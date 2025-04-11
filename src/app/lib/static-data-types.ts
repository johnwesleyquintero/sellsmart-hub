import { CompetitorDataRow } from './amazon-types';

export interface StaticDataTypes {
  'case-studies': CaseStudy[];
  blog: BlogPost[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  personal: PersonalInfo;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  metrics: {
    name: string;
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  }[];
  competitorData: CompetitorDataRow[];
  date: string;
  tags: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  date: string;
  image?: string;
  tags: string[];
  readingTime?: string;
  author?: string;
  content: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  image?: string;
  link?: string;
  github?: string;
  featured: boolean;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string[];
  technologies: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface Skill {
  category: string;
  items: {
    name: string;
    level: number;
  }[];
}

export interface PersonalInfo {
  name: string;
  title: string;
  description: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  twitter?: string;
}
