// src/components/amazon-seller-tools/description-editor.tsx
'use client';

import { useToast } from '@/hooks/use-toast';
import { getScoreColor } from '@/lib/calculations/color-utils';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';

// UI Imports (Consistent with other tools)
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  PlusCircle,
  Save,
  Upload,
  XCircle, // For error dismiss
} from 'lucide-react';
import SampleCsvButton from './sample-csv-button'; // Assuming this exists

// --- Types ---
type ProductDescription = {
  product: string; // Unique identifier for the product within the session
  asin: string; // Optional ASIN
  description: string;
  characterCount: number;
  keywordCount: number;
  score: number; // Score is calculated dynamically
};

// --- Helper Functions (Placeholders - Replace with actual logic) ---

// Simplified keyword counter
const countKeywords = (text: string): number => {
  const commonKeywords = [
    'premium', 'quality', 'durable', 'comfortable', 'advanced', 'innovative',
    'easy', 'use', 'install', 'warranty', 'guarantee', 'support', 'new',
    'improved', 'best', 'top', 'free shipping', // Example keywords
  ];
  const lowerText = text.toLowerCase();
  return commonKeywords.filter((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  ).length;
};

// Simplified scoring algorithm
const calculateScore = (text: string): number => {
  let score = 0;
  const charCount = text.length;
  const keywordCount = countKeywords(text);

  // Length score (max 40)
  if (charCount > 1500) score += 40;
  else if (charCount > 1000) score += 30;
  else if (charCount > 500) score += 20;
  else if (charCount > 200) score += 10;

  // Keyword score (max 30)
  score += Math.min(30, keywordCount * 4); // Adjusted multiplier

  // Readability score (max 30) - Check for paragraphs/breaks
  const paragraphs = text.split('\n').filter(p => p.trim().length > 10).length;
  if (paragraphs >= 5) score += 30;
  else if (paragraphs >= 3) score += 20;
  else if (paragraphs >= 1) score += 10;

  // Bonus for HTML structure (very basic check)
  if (text.includes('<li>') || text.includes('<p>') || text.includes('<b>')) {
      score += Math.min(10, 5); // Small bonus up to 10
  }


  return Math.min(100, Math.max(0, Math.round(score))); // Ensure score is between 0 and 100
};

// --- Component ---
export default function DescriptionEditor() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductDescription | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newProduct, setNewProduct] = useState({ product: '', asin: '', description: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Event Handlers ---

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setActiveProduct(null);
    setShowPreview(false);
    setProducts([]); // Clear previous results on new upload

    Papa.parse<{ product: string; asin?: string; description: string }>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing error: ${results.errors[0].message}. Check row ${results.errors[0].row}.`);
          }

          const requiredColumns = ['product', 'description'];
          const actualHeaders = results.meta.fields || [];
          const missingColumns = requiredColumns.filter(
            (col) => !actualHeaders.includes(col),
          );
          if (missingColumns.length > 0) {
            throw new Error(
              `Missing required CSV columns: ${missingColumns.join(', ')}. Found: ${actualHeaders.join(', ')}`,
            );
          }

          const processedData: ProductDescription[] = results.data
            .map((row, index) => {
              if (!row.product || typeof row.product !== 'string' || !row.product.trim()) {
                console.warn(`Skipping row ${index + 1}: Missing or invalid product name.`);
                return null;
              }
              if (!row.description || typeof row.description !== 'string') {
                 console.warn(`Skipping row ${index + 1} for product "${row.product}": Missing or invalid description.`);
                 return null;
              }
              const description = row.description.trim(); // Trim description
              const productName = row.product.trim();

              // Optional: Check for duplicate product names during upload
              // if (processedData.some(p => p.product === productName)) {
              //   console.warn(`Skipping duplicate product name "${productName}" in CSV.`);
              //   return null;
              // }

              return {
                product: productName,
                asin: (row.asin || '').trim(),
                description: description,
                characterCount: description.length,
                keywordCount: countKeywords(description),
                score: calculateScore(description),
              };
            })
            .filter((item): item is ProductDescription => item !== null);

          if (processedData.length === 0) {
             if (results.data.length > 0) {
                throw new Error("No valid product data found in the CSV after processing. Ensure 'product' and 'description' columns are present and populated.");
             } else {
                throw new Error("The uploaded CSV file appears to be empty or contains no data rows.");
             }
          }

          setProducts(processedData);
          setError(null);
          toast({
            title: 'CSV Processed',
            description: `Loaded ${processedData.length} product descriptions.`,
            variant: 'default',
          });

        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unknown error occurred during processing.';
          setError(message);
          setProducts([]);
          toast({
            title: 'Processing Failed',
            description: message,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
          // Reset file input
          if (event.target) {
            event.target.value = '';
          }
        }
      },
      error: (error: Error) => {
        setIsLoading(false);
        setError(`CSV parsing error: ${error.message}`);
        setProducts([]);
        toast({
          title: 'Parsing Failed',
          description: `CSV parsing error: ${error.message}`,
          variant: 'destructive',
        });
         // Reset file input on parse error too
         if (event.target) {
           event.target.value = '';
         }
      },
    });
  }, [toast]); // Added toast dependency

  const handleDescriptionChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeProduct) return;

    const newDescription = event.target.value;
    const updatedProduct: ProductDescription = {
      ...activeProduct,
      description: newDescription,
      characterCount: newDescription.length,
      keywordCount: countKeywords(newDescription),
      score: calculateScore(newDescription),
    };

    setActiveProduct(updatedProduct);
    setProducts(prevProducts =>
      prevProducts.map((p) =>
        p.product === activeProduct.product ? updatedProduct : p,
      ),
    );
  }, [activeProduct]); // Depends on activeProduct

  const handleManualSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedProduct = newProduct.product.trim();
    const trimmedDescription = newProduct.description.trim();
    const trimmedAsin = newProduct.asin.trim();

    if (!trimmedProduct) {
      const msg = 'Product name cannot be empty.';
      setError(msg);
      toast({ title: 'Validation Error', description: msg, variant: 'destructive' });
      return;
    }
    if (!trimmedDescription) {
      const msg = 'Description cannot be empty.';
      setError(msg);
      toast({ title: 'Validation Error', description: msg, variant: 'destructive' });
      return;
    }
    if (products.some(p => p.product.toLowerCase() === trimmedProduct.toLowerCase())) {
        const msg = `Product "${trimmedProduct}" already exists. Please use a unique name.`;
        setError(msg);
        toast({ title: 'Duplicate Error', description: msg, variant: 'destructive' });
        return;
    }

    const productToAdd: ProductDescription = {
      product: trimmedProduct,
      asin: trimmedAsin,
      description: trimmedDescription,
      characterCount: trimmedDescription.length,
      keywordCount: countKeywords(trimmedDescription),
      score: calculateScore(trimmedDescription),
    };

    setProducts(prev => [...prev, productToAdd]);
    setNewProduct({ product: '', asin: '', description: '' }); // Reset form
    toast({
        title: 'Product Added',
        description: `"${trimmedProduct}" added successfully.`,
        variant: 'default',
    });
  }, [newProduct, products, toast]); // Depends on newProduct, products, toast

  const handleSave = useCallback(() => {
    if (!activeProduct) return;
    // Placeholder for actual save logic (e.g., API call)
    console.log('Saving product:', activeProduct);
    toast({
      title: 'Changes Saved (Locally)',
      description: `Changes for "${activeProduct.product}" updated in the list. Implement backend save if needed.`,
      variant: 'default', // Use 'success' if you have that variant
    });
    // No actual state change needed here as it's updated live via handleDescriptionChange
  }, [activeProduct, toast]); // Depends on activeProduct, toast

  const handleExport = useCallback(() => {
      if (products.length === 0) {
        setError('No data to export.');
        toast({ title: 'Export Error', description: 'No data available to export.', variant: 'destructive' });
        return;
      }
      setError(null);

      // Prepare data for export (include calculated fields)
      const exportData = products.map(p => ({
          product: p.product,
          asin: p.asin,
          description: p.description,
          characterCount: p.characterCount,
          keywordCount: p.keywordCount,
          score: p.score,
      }));

      try {
          const csv = Papa.unparse(exportData);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'product_descriptions_analysis.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast({ title: 'Export Successful', description: 'Data exported to CSV.', variant: 'default' });
      } catch (err) {
          const message = err instanceof Error ? err.message : 'An unknown error occurred during export.';
          setError(`Failed to export data: ${message}`);
          toast({ title: 'Export Failed', description: message, variant: 'destructive' });
      }
  }, [products, toast]); // Depends on products, toast

  const clearData = useCallback(() => {
    setProducts([]);
    setActiveProduct(null);
    setError(null);
    setShowPreview(false);
    setNewProduct({ product: '', asin: '', description: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({ title: 'Data Cleared', description: 'All product descriptions have been removed.', variant: 'default' });
  }, [toast]); // Depends on toast

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Input Section: Consistent two-card layout */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* CSV Upload Card */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                 <h3 className="text-lg font-medium">Upload Descriptions CSV</h3>
                 <p className="text-sm text-muted-foreground">Bulk upload product details</p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click or drag CSV file
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (Requires: product, description; Optional: asin)
                  </span>
                  <input
                    type="file"
                    accept=".csv, text/csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    ref={fileInputRef}
                  />
                </label>
                 <div className="flex justify-center mt-4">
                    <SampleCsvButton
                        dataType="keyword" // Adjust if a specific type is needed
                        fileName="sample-descriptions.csv"
                    />
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Add Product Card */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <form onSubmit={handleManualSubmit} className="space-y-4 p-2">
              <h3 className="text-lg font-medium text-center sm:text-left">Add New Product</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-product-name" className="text-sm font-medium">Product Name*</Label>
                  <Input
                    id="new-product-name"
                    value={newProduct.product}
                    onChange={(e) => setNewProduct({ ...newProduct, product: e.target.value })}
                    placeholder="Enter unique product name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-product-asin" className="text-sm font-medium">ASIN (Optional)</Label>
                  <Input
                    id="new-product-asin"
                    value={newProduct.asin}
                    onChange={(e) => setNewProduct({ ...newProduct, asin: e.target.value })}
                    placeholder="Enter Amazon ASIN"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-product-description" className="text-sm font-medium">Description*</Label>
                  <Textarea
                    id="new-product-description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Enter product description"
                    rows={4} // Adjusted rows
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

       {/* Action Buttons (Clear/Export) - Appear when data exists */}
       {products.length > 0 && !isLoading && (
         <div className="flex justify-end gap-2">
           <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
             <Download className="mr-2 h-4 w-4" />
             Export Data
           </Button>
           <Button variant="outline" size="sm" onClick={clearData} disabled={isLoading}>
             Clear All Data
           </Button>
         </div>
       )}

      {/* Error Display - Consistent Style */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-grow break-words">{error}</span>
           <Button
            variant="ghost"
            size="icon"
            onClick={() => setError(null)}
            className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />
          <p className="text-sm text-muted-foreground">Processing data...</p>
        </div>
      )}

      {/* Product Selection and Editor Section */}
      {products.length > 0 && !isLoading && (
        <div className="space-y-4">
          {/* Product Selection Badges */}
          <div>
             <h4 className="text-sm font-medium mb-2">Select Product to Edit ({products.length}):</h4>
             <div className="flex flex-wrap gap-2">
                {products.map((product) => ( // Index removed from key if product name is unique
                <Badge
                    key={product.product}
                    variant={
                    activeProduct?.product === product.product
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer px-3 py-1 text-sm" // Slightly larger badges
                    onClick={() => {
                      setActiveProduct(product);
                      setShowPreview(false);
                    }}
                >
                    {product.product}
                </Badge>
                ))}
             </div>
          </div>

          {/* Editor/Preview Area */}
          {activeProduct && (
            <Card>
              <CardContent className="p-4">
                {/* Header for Active Product */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                  <div>
                    <h3 className="text-lg font-medium break-words">
                      Editing: <span className="font-semibold">{activeProduct.product}</span>
                    </h3>
                    {activeProduct.asin && (
                      <p className="text-sm text-muted-foreground">
                        ASIN: {activeProduct.asin}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      {showPreview ? 'Edit' : 'Preview'}
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="mr-1.5 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm bg-muted/50 p-2 rounded-md">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">Chars:</span>
                    <span className="font-semibold">{activeProduct.characterCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">Keywords:</span>
                    <span className="font-semibold">{activeProduct.keywordCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">Score:</span>
                    <span className={`font-semibold ${getScoreColor(activeProduct.score)}`}>
                      {activeProduct.score}/100
                    </span>
                  </div>
                </div>

                {/* Editor or Preview */}
                {showPreview ? (
                  <div className="rounded-lg border bg-background p-4 min-h-[200px]">
                    <h4 className="mb-2 text-sm font-semibold text-primary">Description Preview</h4>
                    {/* Safer rendering using whitespace-pre-line */}
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-line text-foreground">
                        {activeProduct.description || <span className="text-muted-foreground italic">No description provided.</span>}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="description-editor" className="text-sm font-medium">Edit Description</Label>
                    <Textarea
                      id="description-editor"
                      value={activeProduct.description}
                      onChange={handleDescriptionChange}
                      placeholder="Enter product description..."
                      rows={15} // Increased rows
                      className="font-mono text-sm mt-1"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Use line breaks for paragraphs. Basic HTML like &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;, &lt;li&gt; might be supported by Amazon. Aim for 1000-2000 characters.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
