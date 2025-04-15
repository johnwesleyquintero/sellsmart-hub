'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { RoadmapSchema } from '@/lib/roadmap-schema';
import { useEffect, useState } from 'react';
const RoadmapDisplay = () => {
    const [roadmapData, setRoadmapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
            setLoading(true);
            setError(null);
            try {
                const response = yield fetch('/todo.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const jsonData = yield response.json();
                // Validate data with Zod
                const validationResult = RoadmapSchema.safeParse(jsonData);
                if (!validationResult.success) {
                    console.error('Schema validation failed:', validationResult.error.errors);
                    throw new Error(`Roadmap data is invalid: ${validationResult.error.errors.map((e) => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
                }
                setRoadmapData(validationResult.data);
            }
            catch (err) {
                console.error('Failed to fetch or parse roadmap data:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            }
            finally {
                setLoading(false);
            }
        });
        fetchData();
    }, []);
    // Helper function to group tasks by category
    const groupTasksByCategory = (tasks) => {
        return tasks.reduce((acc, task) => {
            const category = task.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(task);
            return acc;
        }, {});
    };
    const getStatusColor = (status) => {
        if (status.includes('Done'))
            return 'bg-green-500/10 text-green-500';
        if (status.includes('Progress'))
            return 'bg-blue-500/10 text-blue-500';
        return 'bg-gray-500/10 text-gray-500';
    };
    const getPriorityColor = (priority) => {
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
        return (<Card className="w-full max-w-6xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Project Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full mb-4"/>
          <Skeleton className="h-64 w-full"/>
        </CardContent>
      </Card>);
    }
    if (error) {
        return (<Alert variant="destructive" className="max-w-6xl mx-auto my-8">
        <AlertDescription>Error loading roadmap: {error}</AlertDescription>
      </Alert>);
    }
    if (!roadmapData || roadmapData.length === 0) {
        return (<Alert className="max-w-6xl mx-auto my-8">
        <AlertDescription>No roadmap data found.</AlertDescription>
      </Alert>);
    }
    const groupedTasks = groupTasksByCategory(roadmapData);
    const categories = Object.keys(groupedTasks).sort();
    return (<Card className="w-full max-w-6xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Project Roadmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {categories.map((category) => (<div key={category} className="space-y-4">
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
                  {groupedTasks[category].map((task) => (<TableRow key={task.id}>
                      <TableCell className="font-mono">{task.id}</TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.phase}</Badge>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </div>
          </div>))}
      </CardContent>
    </Card>);
};
export default RoadmapDisplay;
