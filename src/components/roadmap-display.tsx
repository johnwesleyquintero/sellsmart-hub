'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RoadmapData, RoadmapSchema, Task } from '@/lib/roadmap-schema';
import { useEffect, useState } from 'react';

const RoadmapDisplay = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/roadmap');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status.toString()}`);
        }
        const jsonData: unknown = await response.json();

        // Validate data with Zod
        const validationResult = RoadmapSchema.safeParse(jsonData);

        if (!validationResult.success) {
          console.error(
            'Schema validation failed:',
            validationResult.error.errors,
          );
          const errorMessage = validationResult.error.errors
            .map((e) => `${e.path.join('.')} - ${e.message}`)
            .join(', ');
          throw new Error(`Roadmap data is invalid: ${errorMessage}`);
        }

        setRoadmapData(validationResult.data);
      } catch (err) {
        console.error('Failed to fetch or parse roadmap data:', err);
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch((err: unknown) => {
      console.error('Failed to fetch roadmap data:', err);
    });
  }, []);

  // Helper function to group tasks by category
  const groupTasksByCategory = (tasks: RoadmapData): Record<string, Task[]> => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const category = task.category;
      acc[category] = [];
      acc[category].push(task);
      return acc;
    }, {});
  };

  const getStatusColor = (status: string): string => {
    if (status.includes('Done')) return 'bg-green-500/10 text-green-500';
    if (status.includes('Progress')) return 'bg-blue-500/10 text-blue-500';
    return 'bg-gray-500/10 text-gray-500';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500/10 text-red-500';
      case 'High':
        return 'bg-orange-500/10 text-orange-500';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Project Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-6xl mx-auto my-8">
        <AlertDescription>Error loading roadmap: {error}</AlertDescription>
      </Alert>
    );
  }

  if (!roadmapData) {
    return null;
  }

  const groupedTasks = groupTasksByCategory(roadmapData);
  const categories = Object.keys(groupedTasks).sort();

  return (
    <Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Project Roadmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {categories.map((category) => (
          <div key={category} className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {category}
            </h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px]">Status</TableHead>
                    <TableHead className="w-[150px]">Priority</TableHead>
                    <TableHead className="w-[150px]">Phase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTasks[category].map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono">{task.id}</TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(task.status)}
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getPriorityColor(task.priority)}
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.phase}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RoadmapDisplay;
