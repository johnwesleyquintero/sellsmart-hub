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
import { Copy, Upload } from "lucide-react"
import toast from "react-hot-toast"
import { Progress } from "@shadcn/ui/progress"
import { cn } from "@/lib/utils"

export default function LighthouseAuditTool() {
  interface AuditItem {
    category: string
    score: string
    numericScore: number
    details?: Record<string, any>
  }

  const [auditData, setAuditData] = useState<AuditItem[]>([])
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
          numericScore: categories[key].score * 100,
          details: categories[key].auditRefs,
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
          className="hidden"
          id="lighthouse-json"
        />
        <label
          htmlFor="lighthouse-json"
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Lighthouse JSON
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
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={item.numericScore}
                        className={cn(
                          "w-[60px]",
                          item.numericScore >= 90 ? "bg-green-200" :
                          item.numericScore >= 50 ? "bg-yellow-200" : "bg-red-200"
                        )}
                      />
                      <span className={cn(
                        item.numericScore >= 90 ? "text-green-600" :
                        item.numericScore >= 50 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {item.score}
                      </span>
                    </div>
                  </TableCell>
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