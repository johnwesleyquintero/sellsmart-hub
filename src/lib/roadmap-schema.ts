import { z } from 'zod';

// Define enums for controlled vocabulary
export const StatusEnum = z.enum(['✅ Done', '🔄 In Progress', '⏳ Pending']);
export const PriorityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);

// Define the schema for a single task/item
export const TaskSchema = z.object({
  id: z.number().int().positive(),
  description: z.string().min(1),
  status: StatusEnum,
  priority: PriorityEnum,
  category: z.string().min(1),
  phase: z.string().min(1), // e.g., "Phase 1", "Phase 2", "Backlog"
});

// Define the schema for the entire roadmap data (an array of tasks)
export const RoadmapSchema = z.array(TaskSchema);

// Infer the TypeScript type from the schema
export type Task = z.infer<typeof TaskSchema>;
export type RoadmapData = z.infer<typeof RoadmapSchema>;
