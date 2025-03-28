"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Download, FileText, Filter, Upload } from "lucide-react";
import { useState } from "react";

type KeywordData = {
  product: string;
  originalKeywords: string[];
  cleanedKeywords: string[];
  duplicatesRemoved: number;
};

export default function KeywordDeduplicator() {
  const [products, setProducts] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKeywords, setManualKeywords] = useState("");
  const [manualProduct, setManualProduct] = useState("");
  const [processedKeywords, setProcessedKeywords] =
    useState<KeywordData | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    Papa.parse<{
      product: string;
      keywords: string;
    }>(
      file,
      {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            setError(
              "Error parsing CSV file. Please check if the CSV contains 'product' and 'keywords' columns.",
            );
            setIsLoading(false);
            return;
          }

          try {
            const validData = result.data
              .filter((item) => {
                if (!item.product || !item.keywords) return false;
                if (
                  typeof item.product !== "string" ||
                  typeof item.keywords !== "string"
                )
                  return false;
                if (item.product.trim() === "" || item.keywords.trim() === "")
                  return false;
                return true;
              })
              .map((item) => ({
                product: item.product.trim(),
                keywords: item.keywords.trim(),
              }));

            if (validData.length === 0) {
              setError(
                "No valid data found in the CSV file. Please check if the file contains valid product names and keywords.",
              );
              setIsLoading(false);
              return;
            }

            setTimeout(() => {
              try {
                const processedData = fileContent.map((row) => {
                  const originalKeywords = row.keywords
                    .split(",")
                    .map((k) => k.trim());
                  const cleanedKeywords = [...new Set(originalKeywords)];

                  return {
                    ...row,
                    keywords: cleanedKeywords.join(", "),
                    duplicatesRemoved:
                      originalKeywords.length - cleanedKeywords.length,
                  };
                });

                setProducts(processedData);
                setIsLoading(false);
              } catch (err) {
                setError(
                  "Failed to parse CSV file. Please check the format and try again.",
                );
                setIsLoading(false);
              }
            }, 1500);
          } catch (err) {
            setError(
              "Failed to parse CSV file. Please check the format and try again.",
            );
            setIsLoading(false);
          }
        },
      },
      1500,
    );
  };

  const handleManualProcess = () => {
    if (!manualKeywords.trim()) {
      setError("Please enter keywords to process");
      return;
    }

    const originalKeywords = manualKeywords.split(",").map((k) => k.trim());
    const cleanedKeywords = [...new Set(originalKeywords)];

    const result: KeywordData = {
      product: manualProduct || "Manual Entry",
      originalKeywords,
      cleanedKeywords,
      duplicatesRemoved: originalKeywords.length - cleanedKeywords.length,
    };

    setProcessedKeywords(result);
    setProducts([...products, result]);
    setError(null);
  };

  const handleExport = () => {
    if (products.length === 0) return;

    const csvData = products.map((product) => ({
      product: product.product,
      original_keywords: product.originalKeywords.join(", "),
      cleaned_keywords: product.cleanedKeywords.join(", "),
      duplicates_removed: product.duplicatesRemoved,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "deduplicated_keywords.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with your product keywords
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with product name and comma-separated keywords)
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

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium">Manual Entry</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Product Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualProduct}
                    onChange={(e) => setManualProduct(e.target.value)}
                    placeholder="Enter product name"
                    autoComplete="off"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Keywords</label>
                  <Textarea
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                    placeholder="Enter comma-separated keywords"
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter keywords separated by commas
                  </p>
                </div>
                <Button onClick={handleManualProcess} className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  Remove Duplicates
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
          <p className="text-sm text-muted-foreground">
            Processing your keywords...
          </p>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Cleaned Keywords
            </Button>
          </div>

          <div className="space-y-4">
            {products.map((product, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">{product.product}</h3>
                    <Badge
                      variant={
                        product.duplicatesRemoved > 0 ? "default" : "secondary"
                      }
                    >
                      {product.duplicatesRemoved} duplicates removed
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Original Keywords ({product.originalKeywords.length})
                      </h4>
                      <div className="rounded-lg border p-3">
                        <div className="flex flex-wrap gap-2">
                          {product.originalKeywords.map((keyword, i) => (
                            <Badge key={i} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Cleaned Keywords ({product.cleanedKeywords.length})
                      </h4>
                      <div className="rounded-lg border p-3">
                        <div className="flex flex-wrap gap-2">
                          {product.cleanedKeywords.map((keyword, i) => (
                            <Badge key={i} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
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

try {
  console.error(error);
} catch (error) {
  // Handle error
}
