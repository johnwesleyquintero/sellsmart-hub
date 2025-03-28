"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, AlertCircle, Download, Calculator, Info } from "lucide-react"
import Papa from "papaparse"
import SampleCsvButton from "./sample-csv-button"

type CampaignData = {
  campaign: string
  adSpend: number
  sales: number
  acos?: number
  roas?: number
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    Papa.parse<any>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError(`Error parsing CSV file: ${result.errors[0].message}. Please check the format.`)
          setIsLoading(false)
          return
        }

        try {
          // Process the parsed data
          const processedData: CampaignData[] = result.data
            .filter((item) => item.campaign && !isNaN(Number(item.adSpend)) && !isNaN(Number(item.sales)))
            .map((item) => {
              // Calculate metrics
              const adSpend = Number(item.adSpend)
              const sales = Number(item.sales)

              const acos = (adSpend / sales) * 100
              const roas = sales / adSpend

              // Optional metrics
              let ctr, cpc, conversionRate
              if (item.impressions && item.clicks) {
                ctr = (Number(item.clicks) / Number(item.impressions)) * 100
              }
              if (item.clicks) {
                cpc = adSpend / Number(item.clicks)
                if (sales) {
                  conversionRate = (sales / Number(item.clicks)) * 100
                }
              }

              return {
                campaign: String(item.campaign),
                adSpend,
                sales,
                acos,
                roas,
                impressions: item.impressions ? Number(item.impressions) : undefined,
                clicks: item.clicks ? Number(item.clicks) : undefined,
                ctr,
                cpc,
                conversionRate,
              }
            })

          if (processedData.length === 0) {
            setError("No valid data found in CSV. Please ensure your CSV has columns: campaign, adSpend, sales")
            setIsLoading(false)
            return
          }

          setCampaigns(processedData)
          setIsLoading(false)
        } catch (err) {
          setError("Failed to process CSV data. Please ensure your CSV has the correct format")
          setIsLoading(false)
        }
      },
      error: (error) => {
        setError(`Error parsing CSV file: ${error.message}`)
        setIsLoading(false)
      },
    })

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
    if (campaigns.length === 0) {
      setError("No data to export")
      return
    }

    // Prepare data for CSV export
    const exportData = campaigns.map((campaign) => ({
      campaign: campaign.campaign,
      adSpend: campaign.adSpend.toFixed(2),
      sales: campaign.sales.toFixed(2),
      acos: campaign.acos?.toFixed(2),
      roas: campaign.roas?.toFixed(2),
      impressions: campaign.impressions || "",
      clicks: campaign.clicks || "",
      ctr: campaign.ctr?.toFixed(2) || "",
      cpc: campaign.cpc?.toFixed(2) || "",
      conversionRate: campaign.conversionRate?.toFixed(2) || "",
    }))

    // Create CSV content
    const csv = Papa.unparse(exportData)

    // Create a blob and download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "acos_calculations.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const clearData = () => {
    setCampaigns([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Your CSV file should have the following columns: <code>campaign</code>, <code>adSpend</code>,{" "}
            <code>sales</code>
          </p>
          <p>
            Optional columns: <code>impressions</code>, <code>clicks</code>
          </p>
          <p className="mt-1">
            Example: <code>campaign,adSpend,sales,impressions,clicks</code>
            <br />
            <code>Auto Campaign - Wireless Earbuds,245.67,1245.89,12450,320</code>
          </p>
        </div>
      </div>

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
                    ref={fileInputRef}
                  />
                </label>
                <div className="flex justify-center mt-4">
                  <SampleCsvButton dataType="acos" fileName="sample-acos-calculator.csv" />
                </div>
                {campaigns.length > 0 && (
                  <Button variant="outline" className="w-full mt-4" onClick={clearData}>
                    Clear Data
                  </Button>
                )}
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
                      <td className={`px-4 py-3 text-right text-sm font-medium ${getAcosColor(campaign.acos || 0)}`}>
                        {campaign.acos?.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{campaign.roas?.toFixed(2)}x</td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            campaign.acos && campaign.acos < 25
                              ? "default"
                              : campaign.acos && campaign.acos < 35
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {getAcosRating(campaign.acos || 0)}
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

