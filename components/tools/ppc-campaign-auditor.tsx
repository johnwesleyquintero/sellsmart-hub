"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Download,
  FileText,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import Papa from "papaparse";
import { useState } from "react";

type CampaignData = {
  name: string;
  type: string;
  spend: number;
  sales: number;
  acos: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversionRate: number;
  issues?: string[];
  recommendations?: string[];
};

export default function PpcCampaignAuditor() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError("Error parsing CSV file. Please check required columns.");
          setIsLoading(false);
          return;
        }

        const validData = result.data.filter(
          (item) => item.name && item.type && item.spend && item.sales,
        );

        setIsLoading(false);
        setCampaigns(validData);
      },
    });
  };

  const handleExport = () => {
    if (campaigns.length === 0) return;

    const csvData = campaigns.map((campaign) => ({
      name: campaign.name,
      type: campaign.type,
      spend: campaign.spend,
      sales: campaign.sales,
      acos: campaign.acos,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.ctr,
      conversion_rate: campaign.conversionRate,
      issues: campaign.issues?.join("; "),
      recommendations: campaign.recommendations?.join("; "),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "ppc_campaign_audit.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with your Amazon PPC campaign data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
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
          <>
            <Progress value={45} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Analyzing campaign performance...
            </p>
          </>
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
                      ACoS: {campaign.acos.toFixed(2)}% • CTR:{" "}
                      {campaign.ctr.toFixed(2)}% • Conversion Rate:{" "}
                      {campaign.conversionRate.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        Performance Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Spend
                          </div>
                          <div className="text-xl font-semibold">
                            ${campaign.spend.toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Sales
                          </div>
                          <div className="text-xl font-semibold">
                            ${campaign.sales.toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Impressions
                          </div>
                          <div className="text-xl font-semibold">
                            {campaign.impressions.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Clicks
                          </div>
                          <div className="text-xl font-semibold">
                            {campaign.clicks.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Audit Results
                      </h4>
                      <div className="space-y-3">
                        {campaign.issues && campaign.issues.length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-red-600 dark:text-red-400">
                              Issues Identified:
                            </h5>
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

                        {campaign.recommendations &&
                          campaign.recommendations.length > 0 && (
                            <div className="space-y-1">
                              <h5 className="text-xs font-medium text-green-600 dark:text-green-400">
                                Recommendations:
                              </h5>
                              <ul className="list-inside list-disc space-y-1 text-sm">
                                {campaign.recommendations.map(
                                  (recommendation, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1"
                                    >
                                      <TrendingUp className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                                      <span>{recommendation}</span>
                                    </li>
                                  ),
                                )}
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
  );
}
