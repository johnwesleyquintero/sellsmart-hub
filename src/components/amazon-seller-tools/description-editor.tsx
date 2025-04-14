'use client';

import type React from 'react';

import { useState } from 'react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, AlertCircle, Save, Eye } from 'lucide-react';

type ProductDescription = {
  product: string;
  asin?: string;
  description: string;
  characterCount: number;
  keywordCount: number;
  score?: number;
};

export default function DescriptionEditor() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductDescription | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product: '',
    asin: '',
    description: '',
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          interface ProductData {
            product: string;
            asin?: string;
            description: string;
          }

          const requiredColumns = ['product', 'description'];
          const missingColumns = requiredColumns.filter((col) =>
            results.meta.fields ? !results.meta.fields.includes(col) : true,
          );
          if (missingColumns.length > 0) {
            throw new Error(
              `Missing required columns: ${missingColumns.join(', ')}`,
            );
          }

          const processedData: ProductDescription[] = results.data.map(
            (row: unknown) => {
              const productRow = row as ProductData;
              return {
                product: productRow.product,
                asin: productRow.asin || '',
                description: productRow.description,
                characterCount: productRow.description?.length || 0,
                keywordCount: (productRow.description?.match(/\b\w+\b/g) || [])
                  .length,
              };
            },
          );

          setProducts(processedData);
          setError(null);
          toast({
            title: 'CSV Processed',
            description: `Loaded ${processedData.length} product descriptions`,
            variant: 'default',
          });
        } catch (error) {
          setError(
            error instanceof Error ? error.message : 'An error occurred',
          );
          toast({
            title: 'Processing Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
        setIsLoading(false);
      },
      error: (error) => {
        setError(error.message);
        setIsLoading(false);
      },
    });
  };

  const handleDescriptionChange = (value: string) => {
    if (!activeProduct) return;

    const updatedProduct = {
      ...activeProduct,
      description: value,
      characterCount: value.length,
      keywordCount: countKeywords(value),
      score: calculateScore(value),
    };

    setActiveProduct(updatedProduct);

    // Update the product in the products array
    setProducts(
      products.map((p) =>
        p.product === activeProduct.product ? updatedProduct : p,
      ),
    );
  };

  const handleAddProduct = () => {
    if (!newProduct.product || !newProduct.description) {
      setError('Please fill in both product name and description');
      return;
    }

    const productData: ProductDescription = {
      product: newProduct.product,
      asin: newProduct.asin || undefined,
      description: newProduct.description,
      characterCount: newProduct.description.length,
      keywordCount: countKeywords(newProduct.description),
      score: calculateScore(newProduct.description),
    };

    setProducts([...products, productData]);
    setActiveProduct(productData);
    setNewProduct({ product: '', asin: '', description: '' });
    setError(null);
  };

  const countKeywords = (text: string): number => {
    // This is a simplified keyword counter
    // In a real app, you'd have a more sophisticated algorithm
    const commonKeywords = [
      'premium',
      'quality',
      'durable',
      'comfortable',
      'advanced',
      'innovative',
    ];
    return commonKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword.toLowerCase()),
    ).length;
  };

  const calculateScore = (text: string): number => {
    // This is a simplified scoring algorithm
    // In a real app, you'd have a more sophisticated algorithm
    let score = 0;

    // Length score (0-40 points)
    if (text.length > 1000) score += 40;
    else if (text.length > 500) score += 30;
    else if (text.length > 250) score += 20;
    else if (text.length > 100) score += 10;

    // Keyword score (0-30 points)
    const keywordCount = countKeywords(text);
    score += keywordCount * 6;

    // Readability score (0-30 points)
    // This is a very simplified readability check
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength = text.length / (sentences.length || 1);

    if (avgSentenceLength < 25) score += 30;
    else if (avgSentenceLength < 35) score += 20;
    else if (avgSentenceLength < 45) score += 10;

    return Math.min(100, score);
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
                  Upload a CSV file with your product descriptions
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with product name, ASIN, and description)
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
              <h3 className="text-lg font-medium">Add New Product</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Product Name</label>
                  <Input
                    value={newProduct.product}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, product: e.target.value })
                    }
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">ASIN (Optional)</label>
                  <Input
                    value={newProduct.asin}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, asin: e.target.value })
                    }
                    placeholder="Enter Amazon ASIN"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Add Product
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
            Processing your data...
          </p>
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {products.map((product, index) => (
              <Badge
                key={index}
                variant={
                  activeProduct?.product === product.product
                    ? 'default'
                    : 'outline'
                }
                className="cursor-pointer"
                onClick={() => {
                  setActiveProduct(product);
                  setShowPreview(false);
                }}
              >
                {product.product}
              </Badge>
            ))}
          </div>

          {activeProduct && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {activeProduct.product}
                    </h3>
                    {activeProduct.asin && (
                      <p className="text-sm text-muted-foreground">
                        ASIN: {activeProduct.asin}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? (
                        <>Edit</>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </>
                      )}
                    </Button>
                    <Button size="sm">
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <span className="font-medium">Characters:</span>
                    <span>{activeProduct.characterCount}</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <span className="font-medium">Keywords:</span>
                    <span>{activeProduct.keywordCount}</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                    <span className="font-medium">Score:</span>
                    <span
                      className={
                        (activeProduct.score || 0) >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : (activeProduct.score || 0) >= 50
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {activeProduct.score}/100
                    </span>
                  </div>
                </div>

                {showPreview ? (
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 text-sm font-medium">Preview</h4>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {activeProduct.description
                        .split('\n')
                        .map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Textarea
                      value={activeProduct.description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="Enter product description"
                      rows={10}
                      className="font-mono text-sm"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Tip:</span> Aim for 1000+
                      characters with relevant keywords for better visibility.
                    </div>
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
