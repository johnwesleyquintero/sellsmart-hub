# Project Roadmap Creation - React Component with TypeScript and Zod

This guide will walk you through the process of creating a React component using TypeScript and Zod to display your roadmap data from a todo.json file.

---

## Objective

Create a React component using TypeScript to display your roadmap data from a todo.json file, incorporating Zod for schema validation.

### 1. Install Dependencies:

If you haven't already, install Zod:

```bash
npm install zod
# or
npm install zod
```

### 2. Define the Zod Schema (src/schemas/roadmapSchema.ts):

This schema will define the expected structure of your todo.json data and provide type inference.

```typescript
// src/schemas/roadmapSchema.ts
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
```

### 3. Create the Sample Data (public/todo.json):

Place this file in your project's public directory so it can be fetched easily. Make sure the data conforms to the schema you just defined.

```json
// public/todo.json
[
  {
    "id": 1,
    "description": "Project structure & base config",
    "status": "✅ Done",
    "priority": "Critical",
    "category": "Setup",
    "phase": "Phase 1"
  },
  {
    "id": 2,
    "description": "Basic component library setup",
    "status": "✅ Done",
    "priority": "Critical",
    "category": "UI",
    "phase": "Phase 1"
  },
  {
    "id": 3,
    "description": "Next.js app router implementation",
    "status": "✅ Done",
    "priority": "Critical",
    "category": "Core",
    "phase": "Phase 1"
  },
  {
    "id": 4,
    "description": "Complete ACOS Calculator implementation",
    "status": "✅ Done",
    "priority": "Critical",
    "category": "Amazon Tools",
    "phase": "Phase 1"
  },
  {
    "id": 7,
    "description": "Implement responsive design for all tools",
    "status": "✅ Done",
    "priority": "Critical",
    "category": "UI",
    "phase": "Phase 1"
  },
  {
    "id": 14,
    "description": "Implement API key rotation and management",
    "status": "✅ Done",
    "priority": "Critical",
    "category": "Security",
    "phase": "Phase 1"
  },
  {
    "id": 5,
    "description": "Implement PPC Campaign Auditor",
    "status": "⏳ Pending",
    "priority": "High",
    "category": "Amazon Tools",
    "phase": "Phase 2"
  },
  {
    "id": 6,
    "description": "Enhance Keyword Analyzer with trend data",
    "status": "⏳ Pending",
    "priority": "High",
    "category": "Amazon Tools",
    "phase": "Phase 2"
  },
  {
    "id": 8,
    "description": "Add unit tests for Amazon seller tools",
    "status": "⏳ Pending",
    "priority": "High",
    "category": "Testing",
    "phase": "Phase 2"
  },
  {
    "id": 9,
    "description": "Implement authentication & authorization",
    "status": "⏳ Pending",
    "priority": "Critical",
    "category": "Core",
    "phase": "Phase 2"
  },
  {
    "id": 10,
    "description": "Optimize image loading and rendering",
    "status": "⏳ Pending",
    "priority": "Critical",
    "category": "Performance",
    "phase": "Phase 2"
  },
  {
    "id": 11,
    "description": "Create API documentation for all endpoints",
    "status": "⏳ Pending",
    "priority": "High",
    "category": "Documentation",
    "phase": "Phase 2"
  },
  {
    "id": 12,
    "description": "Add dark mode support",
    "status": "⏳ Pending",
    "priority": "Medium",
    "category": "UI",
    "phase": "Phase 2"
  },
  {
    "id": 16,
    "description": "Enhance error handling and user feedback",
    "status": "⏳ Pending",
    "priority": "High",
    "category": "UI",
    "phase": "Phase 2"
  },
  {
    "id": 13,
    "description": "Implement usage tracking for tools",
    "status": "⏳ Pending",
    "priority": "Medium",
    "category": "Analytics",
    "phase": "Phase 3"
  },
  {
    "id": 15,
    "description": "Add Redis caching for API responses",
    "status": "⏳ Pending",
    "priority": "High",
    "category": "Performance",
    "phase": "Phase 3"
  },
  {
    "id": 23,
    "description": "Add rate limiting for API endpoints",
    "status": "⏳ Pending",
    "priority": "Critical",
    "category": "Security",
    "phase": "Phase 3"
  },
  {
    "id": 31,
    "description": "Add support for multiple languages in seller tools",
    "status": "⏳ Pending",
    "priority": "Critical",
    "category": "Amazon Tools",
    "phase": "Backlog"
  },
  {
    "id": 32,
    "description": "Add support for multiple currencies in seller tools",
    "status": "⏳ Pending",
    "priority": "Critical",
    "category": "Amazon Tools",
    "phase": "Backlog"
  }
]
```

### 4. Create the React Component (src/components/RoadmapDisplay.tsx):

This component fetches the data, validates it using the Zod schema, and displays it grouped by category.

```typescript
// src/components/RoadmapDisplay.tsx
import React, { useState, useEffect } from 'react';
import { RoadmapSchema, Task, RoadmapData } from '../schemas/roadmapSchema'; // Adjust path if needed
import './RoadmapDisplay.css'; // We'll create this for basic styling

const RoadmapDisplay: React.FC = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/todo.json'); // Fetches from the public folder
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();

        // Validate data with Zod
        const validationResult = RoadmapSchema.safeParse(jsonData);

        if (!validationResult.success) {
          console.error('Schema validation failed:', validationResult.error.errors);
          // Provide a more user-friendly error message
          throw new Error(`Roadmap data is invalid: ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
        }

        setRoadmapData(validationResult.data);

      } catch (err) {
        console.error("Failed to fetch or parse roadmap data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Helper function to group tasks by category
  const groupTasksByCategory = (tasks: RoadmapData): Record<string, Task[]> => {
    return tasks.reduce((acc, task) => {
      const category = task.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      // Optional: Sort tasks within a category (e.g., by ID or Priority)
      // acc[category].sort((a, b) => a.id - b.id);
      return acc;
    }, {} as Record<string, Task[]>);
  };

  if (loading) {
    return <div className="roadmap-loading">Loading Roadmap...</div>;
  }

  if (error) {
    return <div className="roadmap-error">Error loading roadmap: {error}</div>;
  }

  if (!roadmapData || roadmapData.length === 0) {
    return <div className="roadmap-empty">No roadmap data found.</div>;
  }

  const groupedTasks = groupTasksByCategory(roadmapData);
  const categories = Object.keys(groupedTasks).sort(); // Sort categories alphabetically

  return (
    <div className="roadmap-container">
      <h1>Project Roadmap</h1>

      <div className="roadmap-legends">
         {/* Optional: Add legends if needed */}
         {/* <div><strong>Status:</strong> ✅ Done | 🔄 In Progress | ⏳ Pending</div>
         <div><strong>Priority:</strong> Critical | High | Medium | Low</div> */}
      </div>

      {categories.map(category => (
        <div key={category} className="roadmap-category">
          <h2>{category}</h2>
          <table className="roadmap-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Phase</th>
              </tr>
            </thead>
            <tbody>
              {groupedTasks[category].map(task => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.description}</td>
                  <td className={`status-${task.status.split(' ')[1].toLowerCase()}`}>{task.status}</td>
                  <td className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</td>
                  <td>{task.phase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
       <p className="roadmap-timestamp">
         Roadmap data fetched: {new Date().toLocaleString()}
       </p>
    </div>
  );
};

export default RoadmapDisplay;
```

### 5. Add Basic Styling (src/components/RoadmapDisplay.css):

Create this CSS file in the same directory as the component for basic table styling.

```css
/* src/components/RoadmapDisplay.css */
.roadmap-container {
  font-family: sans-serif;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.roadmap-loading,
.roadmap-error,
.roadmap-empty {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #555;
}

.roadmap-error {
  color: #d9534f; /* Red for errors */
  background-color: #f2dede;
  border: 1px solid #ebccd1;
  border-radius: 4px;
  padding: 15px;
}

.roadmap-legends {
  margin-bottom: 20px;
  font-size: 0.9em;
  color: #666;
}

.roadmap-category {
  margin-bottom: 30px;
}

.roadmap-category h2 {
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
  margin-bottom: 15px;
  color: #333;
}

.roadmap-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 0.95em;
}

.roadmap-table th,
.roadmap-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

.roadmap-table th {
  background-color: #f8f8f8;
  font-weight: bold;
  color: #444;
}

.roadmap-table tbody tr:nth-child(odd) {
  background-color: #fdfdfd;
}

.roadmap-table tbody tr:hover {
  background-color: #f1f1f1;
}

/* Optional: Add some visual cues for priority/status */
.priority-critical {
  font-weight: bold;
  color: #d9534f; /* Red */
}
.priority-high {
  font-weight: bold;
  color: #f0ad4e; /* Orange */
}
.priority-medium {
  color: #5bc0de; /* Blue */
}
.priority-low {
  color: #777; /* Gray */
}

.status-done {
  color: #5cb85c; /* Green */
}
.status-progress {
  color: #5bc0de; /* Blue */
}
.status-pending {
  color: #777; /* Gray */
}

.roadmap-timestamp {
  text-align: right;
  font-size: 0.8em;
  color: #999;
  margin-top: 20px;
}
```

### 6. Use the Component:

Import and use the RoadmapDisplay component in your application (e.g., in App.tsx or another page component).

```typescript
// Example usage in src/App.tsx
import React from 'react';
import RoadmapDisplay from './components/RoadmapDisplay'; // Adjust path if needed
import './App.css'; // Your main app styles

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* Other header content */}
      </header>
      <main>
        <RoadmapDisplay />
      </main>
    </div>
  );
}

export default App;
```

### Summary of Changes and Features:

    Data Source: Uses public/todo.json as the single source of truth for roadmap data.
    Schema Validation: Employs Zod (roadmapSchema.ts) to define the expected structure of todo.json, ensuring data integrity and providing strong TypeScript types (Task, RoadmapData).
    TypeScript: The component and schema are written in TypeScript for type safety.
    React Component (RoadmapDisplay.tsx):
    Fetches data from /todo.json using fetch within a useEffect hook.
    Handles loading and error states gracefully.
    Validates the fetched JSON against the Zod schema (RoadmapSchema.safeParse). If validation fails, it logs details and displays an error message.
    Groups tasks by category for organized display.
    Renders the roadmap data in structured tables, one for each category.
    Structure: Separates concerns: schema definition, data file, component logic, and styling.
    Maintainability: Using a schema makes it easier to manage changes to the data structure over time. Any inconsistencies in todo.json will be caught during validation.
