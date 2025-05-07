'use client';

import { Card, CardContent } from '@/components/ui';
import type { Experience } from '@/lib/types';

// Define the props for the ExperienceSection component.
interface ExperienceSectionProps {
  experience: Experience[]; // An array of Experience objects to display.
}

// ExperienceSection component to display a list of professional experiences.
function ExperienceSection({ experience }: ExperienceSectionProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h3 className="mb-6 text-xl font-semibold">Professional Journey</h3>
        <div className="space-y-8">
          {experience.map((exp, index) => (
            <div
              key={index}
              className="relative border-l-2 border-primary/20 pl-4"
            >
              <div className="absolute -left-[9px] top-[6px] h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
              <div>
                <h4 className="font-semibold">{exp.title}</h4>{' '}
                {/* Display the job title. */}
                <p className="text-sm font-medium text-primary">
                  {exp.company} {/* Display the company name. */}
                </p>
                <p className="text-sm text-muted-foreground">
                  {exp.period} {/* Display the employment period. */}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {exp.description}{' '}
                  {/* Display a brief description of the role. */}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i}>
                      {achievement}
                    </li> /* Display the achievements for the role. */
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExperienceSection;
