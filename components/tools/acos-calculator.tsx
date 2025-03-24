"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertCircle, Download, Calculator } from "lucide-react"

type CampaignData = {
  campaign: string
  adSpend: number
  sales: number
  acos: number
  roas: number
  impressions?: number
  clicks?: number
  ctr?: number
  cpc?: number
  conversionRate?: number
}

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualCampaign, setManualCampaign] = useState({
    campaign: "",
    adSpend: "",
    sales: "",
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    // Simulate CSV parsing
    setTimeout(() => {
      try {
        // This is a simulation - in a real app, you'd use Papa Parse or similar
        const sampleData = [
          {
            campaign: "Auto Campaign - Wireless Earbuds",
            adSpend: 245.67,
            sales: 1245.89,
            impressions: 12450,
            clicks: 320,
          },
          {
            campaign: "Sponsored Products - Phone Cases",
            adSpend: 178.34,
            sales: 567.21,
            impressions: 8750,
            clicks: 245,
          },
          {
            campaign: "Sponsored Brands - Charging Cables",
            adSpend: 89.45,
            sales: 156.78,
            impressions: 4320,
            clicks: 98,
          },
        ]

        const processedData = sampleData.map((item) => {
          const acos = (item.adSpend / item.sales) * 100
          const roas = item.sales / item.adSpend
          const ctr = (item.clicks / item.impressions) * 100
          const cpc = item.adSpend / item.clicks
          const conversionRate = (item.sales / item.clicks) * 100

          return {
            ...item,
            acos,
            roas,
            ctr,
            cpc,
            conversionRate,
          }
        })

        setCampaigns(processedData)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format and try again.")
        setIsLoading(false)
      }
    }, 1500)
  }

  const handleManualCalculate = () => {
    if (!manualCampaign.campaign || !manualCampaign.adSpend || !manualCampaign.sales) {
      setError("Please fill in all fields")
      return
    }

    const adSpend = Number.parseFloat(manualCampaign.adSpend)
    const sales = Number.parseFloat(manualCampaign.sales)

    if (isNaN(adSpend) || isNaN(sales)) {
      setError("Please enter valid numbers for Ad Spend and Sales")
      return
    }

    const acos = (adSpend / sales) * 100
    const roas = sales / adSpend

    const newCampaign: CampaignData = {
      campaign: manualCampaign.campaign,
      adSpend,
      sales,
      acos,
      roas,
    }

    setCampaigns([...campaigns, newCampaign])
    setManualCampaign({ campaign: "", adSpend: "", sales: "" })
    setError(null)
  }

  const handleExport = () => {
    // In a real app, this would generate and download a CSV file
    alert("In a real implementation, this would download a CSV with all ACoS calculations.")
  }

  const getAcosRating = (acos: number): string => {
    if (acos < 15) return "Excellent"
    if (acos < 25) return "Good"
    if (acos < 35) return "Average"
    if (acos < 45) return "Poor"
    return "Critical"
  }

  const getAcosColor = (acos: number): string => {
    if (acos < 15) return "text-green-600 dark:text-green-400"
    if (acos < 25) return "text-emerald-600 dark:text-emerald-400"
    if (acos < 35) return "text-yellow-600 dark:text-yellow-400"
    if (acos < 45) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">Upload a CSV file with your campaign data</p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">Click to upload CSV</span>
                  <span className="text-xs text-muted-foreground">(CSV with campaign name, ad spend, and sales)</span>
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

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium">Manual Calculator</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Campaign Name</label>
                  <Input
                    value={manualCampaign.campaign}
                    onChange={(e) => setManualCampaign({ ...manualCampaign, campaign: e.target.value })}
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ad Spend ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualCampaign.adSpend}
                    onChange={(e) => setManualCampaign({ ...manualCampaign, adSpend: e.target.value })}
                    placeholder="Enter ad spend amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sales ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualCampaign.sales}
                    onChange={(e) => setManualCampaign({ ...manualCampaign, sales: e.target.value })}
                    placeholder="Enter sales amount"
                  />
                </div>
                <Button onClick={handleManualCalculate} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate ACoS
                </Button>
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
          <p className="text-sm text-muted-foreground">Processing your data...</p>
        </div>
      )}

      {campaigns.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Calculations
            </Button>
          </div>

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Campaign</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Ad Spend</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Sales</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">ACoS</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">ROAS</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 text-sm">{campaign.campaign}</td>
                      <td className="px-4 py-3 text-right text-sm">${campaign.adSpend.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm">${campaign.sales.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${getAcosColor(campaign.acos)}`}>
                        {campaign.acos.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{campaign.roas.toFixed(2)}x</td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={campaign.acos < 25 ? "default" : campaign.acos < 35 ? "secondary" : "destructive"}
                        >
                          {getAcosRating(campaign.acos)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-2 text-sm font-medium">ACoS Interpretation Guide</h3>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">Excellent</div>
                <div className="text-green-600 dark:text-green-400">&lt;15%</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">Good</div>
                <div className="text-emerald-600 dark:text-emerald-400">15-25%</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">Average</div>
                <div className="text-yellow-600 dark:text-yellow-400">25-35%</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">Poor</div>
                <div className="text-orange-600 dark:text-orange-400">35-45%</div>
              </div>
              <div className="rounded-lg border bg-background p-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">Critical</div>
                <div className="text-red-600 dark:text-red-400">&gt;45%</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

