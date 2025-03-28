"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, Download, Search } from "lucide-react";

type KeywordData = {
  product: string;
  keywords: string[];
  suggestions?: string[];
  searchVolume?: number;
  competition?: string;
};

export default function KeywordAnalyzer() {
  const [products, setProducts] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    // Simulate CSV parsing
    setTimeout(() => {
      try {
        // This is a simulation - in a real app, you'd use Papa Parse or similar
        const sampleData: KeywordData[] = [
          {
            product: "Wireless Earbuds",
            keywords: ["bluetooth earbuds", "wireless headphones", "earphones"],
            searchVolume: 135000,
            competition: "High",
          },
          {
            product: "Phone Case",
            keywords: ["protective case", "phone cover", "slim case"],
            searchVolume: 74500,
            competition: "Medium",
          },
          {
            product: "Charging Cable",
            keywords: ["fast charging", "usb cable", "phone charger"],
            searchVolume: 52000,
            competition: "Low",
          },
        ];

        const analyzedData = sampleData.map((item) => {
          // Simulate keyword suggestions based on existing keywords
          const suggestions = item.keywords.map((kw) => {
            const variations = [
              `best ${kw}`,
              `${kw} for amazon`,
              `premium ${kw}`,
              `affordable ${kw}`,
            ];
            return variations[Math.floor(Math.random() * variations.length)];
          });
          return { ...item, suggestions };
        });

        setProducts(analyzedData);
        setIsLoading(false);
      } catch (err) {
        setError(
          "Failed to parse CSV file. Please check the format and try again.",
        );
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setError("Please enter a search term");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call for keyword research
    setTimeout(() => {
      const newProduct: KeywordData = {
        product: searchTerm,
        keywords: [searchTerm],
        suggestions: [
          `best ${searchTerm}`,
          `${searchTerm} for amazon`,
          `premium ${searchTerm}`,
          `affordable ${searchTerm}`,
          `${searchTerm} with free shipping`,
        ],
        searchVolume: Math.floor(Math.random() * 100000),
        competition: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
      };

      setProducts([...products, newProduct]);
      setSearchTerm("");
      setIsLoading(false);
    }, 1500);
  };

  const handleExport = () => {
    // In a real app, this would generate and download a CSV file
    alert(
      "In a real implementation, this would download a CSV with all keyword data.",
    );
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
                  Upload a CSV file with your product and keyword data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with columns: product, keywords)
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
              <h3 className="text-lg font-medium">Search for Keywords</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Product or Keyword
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter product or keyword"
                    />
                    <Button onClick={handleSearch} disabled={isLoading}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>
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
          <p className="text-sm text-muted-foreground">Analyzing keywords...</p>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Keywords
            </Button>
          </div>
          <div className="space-y-4">
            {products.map((product, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-medium">{product.product}</h3>
                    {product.searchVolume && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Search Volume:
                        </span>
                        <Badge variant="outline">
                          {product.searchVolume.toLocaleString()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Competition:
                        </span>
                        <Badge
                          variant={
                            product.competition === "High"
                              ? "destructive"
                              : product.competition === "Medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {product.competition}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Current Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {product.keywords.map((keyword, i) => (
                          <Badge key={i} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {product.suggestions && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium">
                          Suggested Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {product.suggestions.map((keyword, i) => (
                            <Badge key={i} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
