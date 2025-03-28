export interface Skill {
  name: string
  level: number
  icon: string
}

export interface Experience {
  title: string
  company: string
  period: string
  description: string
  achievements: string[]
}

export interface Education {
  degree: string
  institution: string
  period: string
  description: string
}

export interface Project {
  id: string
  title: string
  description: string
  image: string
  tags: string[]
  liveUrl?: string
  githubUrl?: string
  category: "frontend" | "backend" | "fullstack" | "data"
}

export interface BlogPost {
  id: string | number
  title: string
  summary: string
  image: string
  date: string
  tags: string[]
  url: string
}

