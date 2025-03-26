import { Metadata } from 'next'
import LighthouseAuditTool from '@/components/tools/lighthouse-audit-tool'
import { ErrorBoundary } from '@/components/error-boundary'

export const metadata: Metadata = {
  title: 'Lighthouse Audit Tool - Free SEO Analysis Tool',
  description: 'Upload your Lighthouse JSON report to analyze and share your website\'s performance, accessibility, best practices, and SEO scores.',
}

export default function LighthouseAuditPage() {
  return (
    <ErrorBoundary>
      <div className="container mx-auto py-8">
        <LighthouseAuditTool />
      </div>
    </ErrorBoundary>
  )
}