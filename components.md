# Component Documentation

## Amazon Seller Tools Modules

### Keyword Analyzer (`keyword-analyzer.tsx`)

- **Function**: Analyzes product keywords from CSV uploads or manual input
- **Features**:
  - CSV validation with required columns (product, keywords)
  - Search volume visualization using Recharts
  - Competition level analysis
  - Automated keyword suggestions
  - Data export capability

### Related Utilities

- `sample-csv-button.tsx`: Provides sample CSV templates
- `keyword-intelligence.ts`: Contains core analysis algorithms
- `csv-uploader.tsx`: Shared CSV handling component

## Data Flow

1. CSV upload → Papaparse parsing → Data validation
2. Async processing via `KeywordIntelligence` utilities
3. Visualization using Recharts components
4. Export handled by unified CSV generator

---

[//]: # (Documentation last updated: ${new Date().toISOString()})
