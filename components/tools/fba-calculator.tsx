"use client";

import type React from "react";
import { type ProductData } from "@/lib/fba-calculator-utils";
import { useFBACalculator } from "@/lib/hooks/use-fba-calculator";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp, AlertCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";

export default function FbaCalculator() {
  const [error, setError] = useState<string | null>(null);
  const { products, isLoading, addProducts, clearProducts } = useFBACalculator({
    onError: (error) => setError(error),
  });
  const [manualProduct, setManualProduct] = useState<ProductData>({
    product: "",
    cost: 0,
    price: 0,
    fees: 0,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse<ProductData>(file, {
      header: true,
      dynamicTyping: true,
      complete: (result: { data: ProductData[]; errors: any[] }) => {
        if (result.errors.length > 0) {
          setError("Error parsing CSV file. Please check the format.");
          return;
        }

        // Filter out rows with missing data
        const validData = result.data.filter(
          (item: ProductData) =>
            item.product &&
            item.cost !== undefined &&
            item.price !== undefined &&
            item.fees !== undefined,
        );

        addProducts(validData);
      },
      error: () => {
        setError("Error parsing CSV file. Please check the format.");
      },
    });
  };

  const handleManualCalculation = async () => {
    if (
      !manualProduct.product ||
      manualProduct.cost <= 0 ||
      manualProduct.price <= 0
    ) {
      setError("Please fill in all fields with valid values");
      return;
    }

    setError(null);
    await addProducts([manualProduct]);

    // Reset form
    setManualProduct({
      product: "",
      cost: 0,
      price: 0,
      fees: 0,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualProduct((prev) => ({
      ...prev,
      [name]: name === "product" ? value : Number.parseFloat(value) || 0,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upload CSV</h3>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV file with columns: product, cost, price, fees
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileUp className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product Name</Label>
                <Input
                  id="product"
                  name="product"
                  value={manualProduct.product}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Product Cost ($)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.cost || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Selling Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.price || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fees">Amazon Fees ($)</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.fees || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
              <Button
                onClick={handleManualCalculation}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Calculate"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Cost ($)</TableHead>
                  <TableHead className="text-right">Price ($)</TableHead>
                  <TableHead className="text-right">Fees ($)</TableHead>
                  <TableHead className="text-right">Profit ($)</TableHead>
                  <TableHead className="text-right">ROI (%)</TableHead>
                  <TableHead className="text-right">Margin (%)</TableHead>
                  <TableHead>Profitability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.product}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.fees.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        item.profit && item.profit < 0
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {item.profit?.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        item.roi && item.roi < 0
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {item.roi?.toFixed(2)}%
                    </TableCell>
                    <TableCell
                      className={`text-right ${
                        item.margin && item.margin < 0
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {item.margin?.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress
                          value={
                            item.margin && item.margin > 0
                              ? Math.min(item.margin, 100)
                              : 0
                          }
                          className={`h-2 ${
                            item.margin && item.margin < 15
                              ? "bg-red-200"
                              : item.margin && item.margin < 30
                              ? "bg-yellow-200"
                              : "bg-green-200"
                          }`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">How to use this calculator:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Upload a CSV file with columns: product, cost, price, fees</li>
          <li>Or manually enter product details in the form</li>
          <li>View calculated profit, ROI, and profit margin</li>
          <li>
            Use the results to make informed decisions about your FBA products
          </li>
          <li>
            Use the results to make informed decisions about your FBA products
          </li>
        </ol>
      </div>
    </div>
  );
}
