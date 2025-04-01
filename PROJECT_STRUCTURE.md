# Project Structure

## Core Directories

```
portfolio/
├── app/               # Next.js application routes
├── components/        # Reusable components
│   └── amazon-seller-tools/  # Seller tools components
│       ├── keyword-analyzer.tsx
│       ├── sample-csv-button.tsx
│       └── amazon-seller-tools.md
├── lib/               # Business logic utilities
│   ├── keyword-intelligence.ts
│   └── generate-sample-csv.ts
├── public/            # Static assets
└── data/              # Sample data and test files

## Key Implementation Details

### Amazon Seller Tools
- Components follow container-presenter pattern
- CSV processing handled by PapaParse
- Data visualization using Recharts
- State management with React hooks
- Shared utilities in /lib directory

### File Type Legend
- 📁 Directory
- 📄 Configuration
- ⚛️ React Component
- 📊 Data Visualization
- 🛠️ Utility/Helper
- 📓 Documentation
```
