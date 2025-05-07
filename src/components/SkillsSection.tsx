'use client';

import { Card, CardContent } from '@/components/ui';
import type { Skill } from '@/lib/types';
import { ReactNode } from 'react';

// Define the props for the SkillsSection component.
interface SkillsSectionProps {
  skills: Skill[]; // An array of Skill objects to display.
  getIconComponent: (iconName: string) => ReactNode; // A function to get the icon component based on the icon name.
}

// SkillsSection component to display a list of skills with progress bars.
function SkillsSection({ skills, getIconComponent }: SkillsSectionProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h3 className="mb-4 text-xl font-semibold">Technical Expertise</h3>
        <div className="space-y-6">
          {skills.map((skill) => (
            <div key={skill.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getIconComponent(skill.icon)}{' '}
                  {/* Render the skill icon using the getIconComponent function. */}
                  <span className="font-medium">{skill.name}</span>{' '}
                  {/* Display the skill name. */}
                </div>
                <span className="text-sm text-muted-foreground">
                  {skill.level}%
                </span>{' '}
                {/* Display the skill level as a percentage. */}
              </div>
              <div
                role="progressbar" // Set the role to progressbar for accessibility.
                aria-valuenow={skill.level} // Set the current value of the progress bar.
                aria-valuemin={0} // Set the minimum value of the progress bar.
                aria-valuemax={100} // Set the maximum value of the progress bar.
                className="h-2 w-full rounded-full bg-gray-200" // Apply styling for the background of the progress bar.
              >
                <div
                  className="h-full rounded-full bg-blue-500" // Apply styling for the filled part of the progress bar.
                  style={{ width: `${skill.level}%` }} // Set the width of the filled part based on the skill level.
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SkillsSection;
