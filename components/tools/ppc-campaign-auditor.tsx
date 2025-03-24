"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertCircle, Download, TrendingUp, TrendingDown } from "lucide-react"

type CampaignData = {
  name: string
  type: string
  spend: number
  sales: number
  acos: number
  impressions: number
  clicks: number
  ctr: number
  conversionRate: number
  issues?: string[]
  recommendations?: string[]
}

export default function PpcCampaignAuditor() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    // Simulate CSV parsing
    setTimeout(() => {
      try {
        // This is a simulation - in a real app, you'd use Papa Parse or similar
        const sampleData: CampaignData[] = [
          {
            name: "Auto Campaign - Wireless Earbuds",
            type: "Auto",
            spend: 245.67,
            sales: 1245.89,
            acos: 19.72,
            impressions: 12450,
            clicks: 320,
            ctr: 2.57,
            conversionRate: 12.5,
          },
          {
            name: "Sponsored Products - Phone Cases",
            type: "Sponsored Products",
            spend: 178.34,
            sales: 567.21,
            acos: 31.44,
            impressions: 8750,
            clicks: 245,
            ctr: 2.8,
            conversionRate: 7.3,
          },
          {
            name: "Sponsored Brands - Charging Cables",
            type: "Sponsored Brands",
            spend: 89.45,
            sales: 156.78,
            acos: 57.05,
            impressions: 4320,
            clicks: 98,
            ctr: 2.27,
            conversionRate: 5.1,
          },
        ]

        const analyzedData = sampleData.map((campaign) => {
          // Analyze campaign performance
          const issues: string[] = []
          const recommendations: string[] = []

          if (campaign.acos > 30) {
            issues.push("High ACoS")
            recommendations.push("Reduce bids on keywords with high ACoS")
          }

          if (campaign.ctr < 0.3) {
            issues.push("Low CTR")
            recommendations.push("Improve ad copy and images to increase CTR")
          }

          if (campaign.conversionRate < 8) {
            issues.push("Low conversion rate")
            recommendations.push("Optimize product listing and target more relevant keywords")
          }

          if (campaign.clicks < 100) {
            issues.push("Low click volume")
            recommendations.push("Increase bids or budget to get more visibility")
          }

          if (campaign.type === "Auto" && campaign.acos < 20) {
            recommendations.push("Extract converting search terms and create manual campaigns")
          }

          return { ...campaign, issues, recommendations }
        })

        setCampaigns(analyzedData)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format and try again.")
        setIsLoading(false)
      }
    }, 1500)
  }

  const handleExport = () => {
    // In a real app, this would generate and download a CSV file
    alert("In a real implementation, this would download a CSV with all audit data.")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload Campaign Data</h3>
                <p className="text-sm text-muted-foreground">Upload a CSV file with your Amazon PPC campaign data</p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">Click to upload CSV</span>
                  <span className="text-xs text-muted-foreground">
                    (Download campaign report from Amazon Ads and upload here)
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={45} className="h-2" />
          <p className="text-sm text-muted-foreground">Analyzing campaign performance...</p>
        </div>
      )}

      {campaigns.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Audit Report
            </Button>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{campaign.name}</h3>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      ACoS: {campaign.acos.toFixed(2)}% • CTR: {campaign.ctr.toFixed(2)}% • Conversion Rate:{" "}
                      {campaign.conversionRate.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Performance Metrics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Spend</div>
                          <div className="text-xl font-semibold">${campaign.spend.toFixed(2)}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Sales</div>
                          <div className="text-xl font-semibold">${campaign.sales.toFixed(2)}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Impressions</div>
                          <div className="text-xl font-semibold">{campaign.impressions.toLocaleString()}</div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">Clicks</div>
                          <div className="text-xl font-semibold">{campaign.clicks.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">Audit Results</h4>
                      <div className="space-y-3">
                        {campaign.issues && campaign.issues.length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-red-600 dark:text-red-400">Issues Identified:</h5>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                              {campaign.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <TrendingDown className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {campaign.recommendations && campaign.recommendations.length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-green-600 dark:text-green-400">Recommendations:</h5>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                              {campaign.recommendations.map((recommendation, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <TrendingUp className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                                  <span>{recommendation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

