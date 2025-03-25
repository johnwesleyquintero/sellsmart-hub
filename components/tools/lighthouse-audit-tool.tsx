import { useState } from 'react'
import { Button } from "@shadcn/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shadcn/ui/table"
import { Copy } from "lucide-react"
import toast from "react-hot-toast"

export default function LighthouseAuditTool() {
  const [auditData, setAuditData] = useState<any[]>([])
  const [markdown, setMarkdown] = useState<string>('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      toast.error('Please upload a valid JSON file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        const categories = jsonData.categories
        const parsedData = Object.keys(categories).map((key) => ({
          category: categories[key].title,
          score: (categories[key].score * 100).toFixed(2) + '%',
        }))
        setAuditData(parsedData)
        generateMarkdown(parsedData)
      } catch (error) {
        toast.error('Error parsing JSON file')
      }
    }
    reader.readAsText(file)
  }

  const generateMarkdown = (data: any[]) => {
    const markdownTable = `
| Category | Score |
|----------|-------|
${data.map((item) => `| ${item.category} | ${item.score} |`).join('\n')}
`
    setMarkdown(markdownTable)
  }

  const copyMarkdownToClipboard = () => {
    navigator.clipboard.writeText(markdown)
    toast.success('Markdown copied to clipboard')
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">Lighthouse Audit Tool</h1>
        <p className="text-muted-foreground">Upload a Lighthouse JSON file to view and share audit data.</p>
      </div>
      <div className="mb-4">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="file-input file-input-bordered file-input-primary w-full max-w-xs"
        />
      </div>
      {auditData.length > 0 && (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button onClick={copyMarkdownToClipboard} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy as Markdown
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}