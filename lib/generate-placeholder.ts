type DiagramType =
  | 'flow'
  | 'sequence'
  | 'class'
  | 'graph'
  | 'er'
  | 'ai'
  | 'analytics'
  | 'web';

export function generatePlaceholderDiagram(
  type: DiagramType = 'flow',
  title = '',
): string {
  switch (type) {
    case 'ai':
      return `
        flowchart TD
          A[Data Collection] -->|Process| B[AI Analysis]
          B --> C[Pattern Recognition]
          B --> D[Predictive Models]
          C --> E[Automated Actions]
          D --> E
          E --> F[Optimization]
          style A fill:#3b82f6,color:#fff
          style B fill:#6366f1,color:#fff
          style C fill:#8b5cf6,color:#fff
          style D fill:#a855f7,color:#fff
          style E fill:#d946ef,color:#fff
          style F fill:#ec4899,color:#fff
      `;
    case 'analytics':
      return `
        flowchart LR
          A[Raw Data] --> B[ETL Process]
          B --> C[Data Warehouse]
          C --> D[Analytics Engine]
          D --> E1[Dashboards]
          D --> E2[Reports]
          D --> E3[Insights]
          style A fill:#3b82f6,color:#fff
          style B fill:#6366f1,color:#fff
          style C fill:#8b5cf6,color:#fff
          style D fill:#a855f7,color:#fff
          style E1 fill:#d946ef,color:#fff
          style E2 fill:#d946ef,color:#fff
          style E3 fill:#d946ef,color:#fff
      `;
    case 'web':
      return `
        flowchart TD
          A[Frontend] --> B[API Layer]
          B --> C[Backend Services]
          C --> D[Database]
          A --> E[Static Assets]
          E --> F[CDN]
          style A fill:#3b82f6,color:#fff
          style B fill:#6366f1,color:#fff
          style C fill:#8b5cf6,color:#fff
          style D fill:#a855f7,color:#fff
          style E fill:#d946ef,color:#fff
          style F fill:#ec4899,color:#fff
      `;
    case 'flow':
      return `
        flowchart TD
          A[Inventory Data] -->|Process| B[Catalog System]
          B --> C[Listing Management]
          B --> D[Account Health]
          C --> E[Optimization]
          D --> E
          style A fill:#3b82f6,color:#fff
          style B fill:#6366f1,color:#fff
          style C fill:#8b5cf6,color:#fff
          style D fill:#a855f7,color:#fff
          style E fill:#d946ef,color:#fff
      `;
    case 'sequence':
      return `
        sequenceDiagram
          participant T as Training
          participant W as Workflow
          participant O as Operations
          T->>W: Onboarding Process
          W->>O: Standard Procedures
          O->>T: Feedback Loop
          Note over T,O: 35% Productivity Increase
      `;
    case 'class':
      return `
        classDiagram
          class ClientEngagement {
            +onboarding()
            +communication()
            +satisfaction()
          }
          class InventoryManagement {
            +tracking()
            +optimization()
          }
          class BestPractices {
            +guidelines()
            +implementation()
          }
          ClientEngagement --|> BestPractices
          InventoryManagement --|> BestPractices
      `;
    case 'graph':
      return `
        graph TD
          A((Start)) --> B{Process}
          B -->|Yes| C[OK]
          B -->|No| D[Error]
          C --> E((End))
          D --> E
      `;
    case 'er':
      return `
        erDiagram
          DATA ||--o{ ANALYSIS : contains
          ANALYSIS ||--|{ INSIGHTS : produces
          INSIGHTS }|..|{ ACTIONS : triggers
      `;
    default:
      return generatePlaceholderDiagram('flow');
  }
}
