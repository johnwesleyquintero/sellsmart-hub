# Wesley Quintero - Professional Portfolio

**[View Live Portfolio](https://wesleyquintero.vercel.app/)**

A modern, responsive portfolio website showcasing my skills, projects, and professional experience as a Data-Driven Amazon & E-commerce Specialist.

![Portfolio Preview](public/portfolio-preview.svg)

## Features

- Modern, responsive UI with dark/light mode support.
- Advanced Amazon Seller Tools suite including:
  - ACoS Calculator with historical trend analysis.
  - Competitor Analyzer for pricing and listing performance.
  - Description Editor with real-time preview, keyword optimization, and CSV export.
  - FBA Calculator with robust CSV upload and error validation.
  - Keyword Analyzer and Deduplicator with smart duplicate removal.
  - PPC Campaign Auditor generating detailed campaign CSV reports.
  - Profit Margin Calculator and Sales Estimator with dynamic market data analysis.
- Integrated blog with MDX support, rich typography, and related posts suggestions.

### Enhanced Resume Download

- One-click PDF resume download
- Optimized file size and fast delivery
- Automatic PDF generation from profile data
- Cached for improved performance

### Blog Structure

- MDX-powered content with code highlighting
- Custom SVG illustrations for each post
- Rich typography with Tailwind Typography
- Responsive images and media
- Category-based filtering
- Reading time estimation
- Related posts suggestions

## Technologies Used

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- MDX for blog content
- Lucide React icons
- Vercel hosting

## Projects

- [SellSmart Hub](https://sellsmart-hub.vercel.app/) - AI-powered analytics and automation tools for Amazon sellers
- [DevFlowDB](https://devflowdb.vercel.app/) - Lightweight WASM-powered SQL database
- [Inventory Management](https://sellsmart-docs.vercel.app/) - Streamlined listing management & account health
- [FBA Department Operations](https://sellsmart-docs.vercel.app/) - Comprehensive training & workflow planning
- [SellSmart Design x Docs](https://sellsmart-docs.vercel.app/) - Design system documentation
- [Wholesale Buyer's Guide](https://sellsmart-docs.vercel.app/) - Client engagement & inventory management

## Blog

The portfolio includes a fully-featured blog with MDX support:

- Static generation of blog pages
- Custom SVG illustrations for each post
- Rich typography with Tailwind Typography
- Code syntax highlighting
- Responsive design for all devices

## Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/johnwesleyquintero/portfolio.git
   cd portfolio
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Start development server

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Development

To contribute to this project:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## Deployment

This project supports both automatic CI/CD deployment and manual workflows:

### Automated Deployment (CI/CD)

- Pushes to `main` branch trigger production deployment
- PR environments created for branches matching `feat/*` or `fix/*`

### Manual Deployment

```bash
npm install -g vercel@latest
vercel deploy --prod --confirm
```

### Environment Configuration

Ensure these environment variables are set in Vercel:

- `NEXT_PUBLIC_VERCEL_ENV` (production/preview/development)
- `NEXT_PUBLIC_GA_ID` (Analytics)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (Contact form)
- `MONGODB_URI` (Database connection string)
- `MONGODB_DB_NAME` (Database name)

### CI/CD Features

- Automated testing via `vercel.yml`
- Branch preview environments
- Rollback protection
- Deployment status checks

## Environment Variables

Copy `.env.example` to `.env` and update with your own values:

```bash
cp .env.example .env
```

## Available Scripts

- `npm run dev`: Starts development server
- `npm run build`: Creates production build
- `npm run start`: Runs production server
- `npm run lint`: Runs ESLint
- `npm run format`: Formats code with Prettier

## Tech Stack Details

- **Next.js 14**: App Router, Server Components, Streaming
- **TypeScript**: Strict typing throughout the project
- **Tailwind CSS**: Utility-first CSS with dark/light mode support
- **shadcn/ui**: Accessible, customizable components
- **MDX**: Markdown with React component support

## Tools Documentation

| Tool Name                | Status         | Description                                                                                   |
| ------------------------ | -------------- | --------------------------------------------------------------------------------------------- |
| ACoS Calculator          | Functional     | Advanced ACoS calculator with historical trend analysis and campaign optimization suggestions |
| Competitor Analyzer      | In Development | Core metrics implemented, pricing analysis improvements pending (#ID24)                       |
| Description Editor       | Functional     | Rich text editor with A+ content support and keyword optimization                             |
| FBA Calculator           | Functional     | Calculates FBA fees, profit margins, and storage costs                                        |
| Keyword Analyzer         | Functional     | Analyzes keyword performance, search volume, and competition                                  |
| Keyword Deduplicator     | Functional     | Identifies and removes duplicate keywords with smart matching                                 |
| Keyword Trend Analyzer   | In Development | Basic trend tracking implemented, seasonal analysis pending (#ID6)                            |
| Listing Quality Checker  | Functional     | Evaluates listing quality and suggests improvements                                           |
| PPC Campaign Auditor     | In Development | Core analysis implemented, optimization features pending (#ID5)                               |
| Profit Margin Calculator | Functional     | Calculates profit margins with dynamic cost factors                                           |
| Sales Estimator          | Functional     | Estimates sales potential with market data analysis                                           |
| Sample CSV Button        | Functional     | Generates sample CSV data for testing tools                                                   |

---

[//]: # (Documentation last updated: ${new Date().toISOString()})
