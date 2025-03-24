"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, LineChart, Code, Brain, Database, Workflow } from "lucide-react"
import type { Skill, Experience } from "@/lib/types"
import skillsData from "@/data/skills.json"
import experienceData from "@/data/experience.json"

const skills: Skill[] = skillsData.skills

const experience: Experience[] = experienceData.experience

const education = [
  {
    degree: "Bachelor's degree, Elementary Education and Teaching",
    institution: "University of Southeastern Philippines",
    period: "2015 - 2019",
    description: "Licensed Professional Teacher with focus on educational technology.",
  },
  {
    degree: "Educational Technology",
    institution: "Iowa State University",
    period: "May 2018",
    description: "Specialized training in educational technology applications.",
  },
  {
    degree: "Information Technology",
    institution: "Magugpo Institute of Technology",
    period: "2014",
    description: "Foundation in information technology principles and applications.",
  },
]

export default function AboutSection() {
  // Function to get the appropriate icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "LineChart":
        return <LineChart className="h-5 w-5 text-primary" />
      case "Code":
        return <Code className="h-5 w-5 text-primary" />
      case "Brain":
        return <Brain className="h-5 w-5 text-primary" />
      case "Database":
        return <Database className="h-5 w-5 text-primary" />
      case "Workflow":
        return <Workflow className="h-5 w-5 text-primary" />
      default:
        return <Sparkles className="h-5 w-5 text-primary" />
    }
  }

  return (
    <section id="about" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-950/50 dark:to-purple-950/50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">About Me</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Experience & Skills</h2>
          <p className="text-xl text-muted-foreground">
            Data-Driven Amazon & E-commerce Specialist with expertise in automation and insights generation.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="mb-4 text-xl font-semibold">Technical Expertise</h3>
                <div className="space-y-6">
                  {skills.map((skill) => (
                    <div key={skill.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getIconComponent(skill.icon)}
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{skill.level}%</span>
                      </div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 text-xl font-semibold">Education</h3>
                  <div className="space-y-4">
                    {education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-primary/20 pl-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold">{edu.degree}</h4>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{edu.institution}</p>
                        <p className="text-sm text-muted-foreground">{edu.period}</p>
                        <p className="mt-2 text-sm">{edu.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-6 text-xl font-semibold">Professional Journey</h3>
                  <div className="space-y-8">
                    {experience.map((exp, index) => (
                      <div key={index} className="relative border-l-2 border-primary/20 pl-4">
                        <div className="absolute -left-[9px] top-[6px] h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
                        <div>
                          <h4 className="font-semibold">{exp.title}</h4>
                          <p className="text-sm font-medium text-primary">{exp.company}</p>
                          <p className="text-sm text-muted-foreground">{exp.period}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{exp.description}</p>
                          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </section>
  )
}
