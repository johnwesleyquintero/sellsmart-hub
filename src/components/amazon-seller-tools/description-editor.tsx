import { getAllProhibitedKeywords } from '@/actions/keywordActions';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/sanitize'; // Import sanitizeHtml
import debounce from 'lodash.debounce'; // Import debounce from a utility library
import {
  AlertCircle,
  Download,
  Eye,
  FileText,
  PlusCircle,
  Save,
  Upload,
} from 'lucide-react';
import Papa from 'papaparse';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { z } from 'zod';

// UI Imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DataCard from './DataCard';
import SampleCsvButton from './sample-csv-button';

// --- Types ---
type ProductDescription = {
  product: string; // Unique identifier
  asin: string;
  description: string;
  characterCount: number;
  keywordCount: number;
  score: number;
};

// Type for raw CSV row data
type CsvRowData = {
  product?: string | undefined;
  asin?: string | undefined;
  description?: string | undefined;
  // Allow any other string keys from PapaParse
  [key: string]: string | undefined;
};

// Zod Schema for Manual Input Validation
const manualProductSchema = z.object({
  product: z.string().trim().min(1, 'Product name cannot be empty.'),
  asin: z.string().trim(), // Optional, no specific validation needed here unless required
  description: z.string().trim().min(1, 'Description cannot be empty.'),
});

type ManualProduct = z.infer<typeof manualProductSchema>;

// --- Helper Functions (Moved Outside Component) ---

// Counts occurrences of prohibited keywords (case-insensitive)
const countKeywords = (text: string, prohibitedKeywords: string[]): number => {
  if (!text || prohibitedKeywords.length === 0) {
    return 0;
  }
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of prohibitedKeywords) {
    // Use regex for whole word matching if needed, simple includes for now
    if (lowerText.includes(keyword.toLowerCase())) {
      count++;
    }
  }
  return count;
};

// Calculates a score based on description characteristics
const calculateScore = (text: string, prohibitedKeywords: string[]): number => {
  let score = 0;
  const charCount = text?.length || 0;
  const prohibitedCount = countKeywords(text, prohibitedKeywords);

  // Length score (max 40)
  if (charCount >= 1500) score += 40;
  else if (charCount >= 1000) score += 30;
  else if (charCount >= 500) score += 20;
  else if (charCount >= 200) score += 10;

  // Penalize prohibited keywords (significant penalty)
  score -= prohibitedCount * 10; // Increased penalty

  // Readability score (max 30) - Check for paragraphs/breaks
  const paragraphs = text
    .split('\n')
    .filter((p) => p.trim().length > 20).length; // Slightly longer paragraphs
  if (paragraphs >= 5) score += 30;
  else if (paragraphs >= 3) score += 20;
  else if (paragraphs >= 1) score += 10;

  // Bonus for basic HTML structure (max 10)
  // FIX: Corrected regex for HTML structure check
  const hasStructure = /<(?:p|li|b|strong|ul|ol)\b[^>]*>/i.test(text);
  if (hasStructure) {
    score += 10;
  }

  // Bonus for Call to Action (very basic check) (max 10)
  if (/add to cart|buy now|shop now/i.test(text)) {
    score += 10;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
};

// --- NEW Helper Function to process a single CSV row ---
const processCsvRow = (
  row: CsvRowData,
  index: number,
  actualHeaders: string[],
  prohibitedKeywords: string[],
): ProductDescription | null => {
  try {
    // Find headers case-insensitively
    const productHeader = actualHeaders.find(
      (h) => h.toLowerCase() === 'product',
    );
    const descriptionHeader = actualHeaders.find(
      (h) => h.toLowerCase() === 'description',
    );
    const asinHeader = actualHeaders.find((h) => h.toLowerCase() === 'asin');

    // Use the found headers to access row data, providing undefined if header not found
    const product = productHeader ? row[productHeader]?.trim() : undefined;
    const description = descriptionHeader
      ? row[descriptionHeader]?.trim()
      : undefined;
    const asin = asinHeader ? row[asinHeader]?.trim() : '';

    // Validate essential data
    if (!product) {
      logger.warn(`Skipping row ${index + 1}: Missing product name.`, {
        component: 'DescriptionEditor/processCsvRow',
      });
      return null;
    }
    if (!description) {
      logger.warn(
        `Skipping row ${index + 1} for "${product}": Missing description.`,
        { component: 'DescriptionEditor/processCsvRow' },
      );
      return null;
    }

    // Calculate metrics
    const score = calculateScore(description, prohibitedKeywords);
    const keywordCount = countKeywords(description, prohibitedKeywords);
    const characterCount = description.length;

    return {
      product: product,
      asin: asin || '',
      description: description,
      characterCount: characterCount,
      keywordCount: keywordCount,
      score: score,
    };
  } catch (validationError) {
    logger.warn(
      `Validation/Processing failed for row ${index + 1}: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`,
      { component: 'DescriptionEditor/processCsvRow', rowData: row },
    );
    return null;
  }
};

// --- Sub-Components ---

// Form for adding a new product manually
interface ManualAddProductFormProps {
  onSubmit: (data: ManualProduct) => void;
  isLoading: boolean;
}

function ManualAddProductForm({
  onSubmit,
  isLoading,
}: Readonly<ManualAddProductFormProps>) {
  const [formData, setFormData] = useState({
    product: '',
    asin: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setFormError(undefined); // Clear error on change
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(undefined);
    const result = manualProductSchema.safeParse(formData);

    if (!result.success) {
      // Get the first error message
      const firstError = result.error.errors[0]?.message || 'Invalid input.';
      setFormError(firstError);
      return;
    }

    onSubmit(result.data);
    setFormData({ product: '', asin: '', description: '' }); // Reset form
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <h3 className="text-lg font-medium text-center sm:text-left">
        Add New Product
      </h3>
      {formError && (
        <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
      )}
      <div className="space-y-3">
        <div>
          <Label htmlFor="product" className="text-sm font-medium">
            Product Name*
          </Label>
          <Input
            id="product"
            value={formData.product}
            onChange={handleChange}
            placeholder="Enter unique product name"
            required
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="asin" className="text-sm font-medium">
            ASIN (Optional)
          </Label>
          <Input
            id="asin"
            value={formData.asin}
            onChange={handleChange}
            placeholder="Enter Amazon ASIN"
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Description*
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData({
                ...formData,
                description: sanitizeHtml(e.target.value),
              })
            }
            placeholder="Enter product description"
            rows={4}
            required
            className="mt-1"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
    </form>
  );
}

// Area for editing/previewing the selected product's description
interface ProductEditorAreaProps {
  product: ProductDescription;
  prohibitedKeywords: string[];
  onDescriptionChange: (productId: string, newDescription: string) => void;
  onSave: (product: ProductDescription) => void;
}

function ProductEditorArea({
  product,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prohibitedKeywords, // Pass prohibitedKeywords here
  onDescriptionChange,
  onSave,
}: Readonly<ProductEditorAreaProps>) {
  const [showPreview, setShowPreview] = useState(false);

  // Debounce the description change handler using lodash.debounce
  const debouncedDescriptionChange = useCallback(
    debounce((newDescription: string) => {
      onDescriptionChange(product.product, newDescription);
    }, 300), // Debounce time: 300ms
    [onDescriptionChange, product.product], // Dependencies for useCallback
  );

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    // Call the debounced function with the current value
    debouncedDescriptionChange(event.target.value);
  };

  const getScoreColorClass = (scoreValue: number): string => {
    if (scoreValue >= 80) return 'text-green-600 dark:text-green-400';
    if (scoreValue >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header for Active Product */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="text-lg font-medium break-words">
              Editing: <span className="font-semibold">{product.product}</span>
            </h3>
            {product.asin && (
              <p className="text-sm text-muted-foreground">
                ASIN: {product.asin}
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
            <Button size="sm" onClick={() => onSave(product)}>
              <Save className="mr-1.5 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm bg-muted/50 p-2 rounded-md">
          <div className="flex items-center gap-1">
            <span className="font-medium text-muted-foreground">Chars:</span>
            <span className="font-semibold">
              {product.characterCount?.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-muted-foreground">
              Prohibited:
            </span>
            <span
              className={`font-semibold ${product.keywordCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {product.keywordCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium text-muted-foreground">Score:</span>
            <span
              className={`font-semibold ${getScoreColorClass(product.score)}`}
            >
              {product.score}/100
            </span>
          </div>
        </div>

        {/* Editor or Preview */}
        {showPreview ? (
          <div className="rounded-lg border bg-background p-4 min-h-[200px]">
            <h4 className="mb-2 text-sm font-semibold text-primary">
              Description Preview
            </h4>
            {/* Render HTML safely or use a dedicated library if needed */}
            <div
              className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-line text-foreground"
              // Using dangerouslySetInnerHTML is generally discouraged if the source isn't trusted.
              // Consider a sanitizer library (like DOMPurify) if descriptions can contain arbitrary HTML.
              // For simple cases where you control the input or only allow basic tags, this might be acceptable.
              // dangerouslySetInnerHTML={{ __html: product.description || '<span class="text-muted-foreground italic">No description provided.</span>' }}

              // Safer alternative: Render as plain text preserving line breaks
            >
              {product.description || (
                <span className="text-muted-foreground italic">
                  No description provided.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Label
              htmlFor="description-editor"
              className="text-sm font-medium sr-only" // Label is visually provided by the header
            >
              Edit Description
            </Label>
            <Textarea
              id="description-editor"
              defaultValue={product.description} // Use defaultValue for uncontrolled using debounce
              onChange={handleTextareaChange}
              placeholder="Enter product description..."
              rows={15}
              className="font-mono text-sm mt-1"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Use line breaks for paragraphs. Basic HTML like{' '}
              {/* FIX: Use HTML entities to display tags as text */}
              <code>&lt;b&gt;</code>, <code>&lt;p&gt;</code>,{' '}
              <code>&lt;ul&gt;</code>, <code>&lt;li&gt;</code> may be supported
              by Amazon. Aim for 1000-2000 characters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Component ---
export default function DescriptionEditor() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductDescription[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Combined loading state
  const [error, setError] = useState<string | undefined>(undefined);
  const [activeProductId, setActiveProductId] = useState<string | undefined>(
    undefined,
  ); // Store ID only
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [prohibitedKeywords, setProhibitedKeywords] = useState<string[]>([]);

  // Fetch prohibited keywords on mount
  useEffect(() => {
    const fetchKeywords = async () => {
      setIsLoading(true);
      try {
        const keywords = await getAllProhibitedKeywords();
        setProhibitedKeywords(keywords);
        logger.info('Fetched prohibited keywords.', {
          count: keywords.length,
          component: 'DescriptionEditor',
        });
      } catch (err) {
        logger.error('Failed to fetch prohibited keywords', {
          error: err,
          component: 'DescriptionEditor',
        });
        setError('Failed to load prohibited keywords list.');
        toast({
          title: 'Keyword Fetch Failed',
          description: 'Could not load prohibited keywords.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchKeywords();
  }, [toast]);

  // Find the active product object based on the ID
  const activeProduct = useMemo(
    () => products.find((p) => p.product === activeProductId) || undefined,
    [products, activeProductId],
  );

  // --- Event Handlers ---

  // Corrected handleFileUpload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(undefined);
      setProducts([]);
      setActiveProductId(undefined); // Also reset active product

      console.log('Before Papa.parse');
      Papa.parse<CsvRowData>(file, {
        // Specify the expected row type
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // More robust header validation
          if (!results.meta || !results.meta.fields) {
            setError('CSV file is empty or has no headers.');
            setIsLoading(false);
            return;
          }

          const actualHeaders = results.meta.fields.map((h) => h.toLowerCase());
          const requiredHeaders = ['product', 'description'];
          const missingHeaders = requiredHeaders.filter(
            (header) => !actualHeaders.includes(header),
          );

          if (missingHeaders.length > 0) {
            setError(
              `Missing required headers: ${missingHeaders.join(', ')}. Please check your CSV file.`,
            );
            setIsLoading(false);
            return;
          }

          // Process each row
          const processedProducts = results.data
            .map((row, index) =>
              processCsvRow(row, index, actualHeaders, prohibitedKeywords),
            )
            .filter(
              (product): product is ProductDescription => product !== null,
            ); // Filter out nulls

          setProducts(processedProducts);
          setIsLoading(false);
          toast({
            title: 'CSV Uploaded',
            description: `Successfully processed ${processedProducts.length} products.`,
            variant: 'default',
          });
        },
        error: (err: Error) => {
          setError(`CSV parsing error: ${err.message}`);
          setIsLoading(false);
          setProducts([]);
          setActiveProductId(undefined);
          toast({
            title: 'CSV Error',
            description: `Error parsing CSV: ${err.message}`,
            variant: 'destructive',
          });
        },
      });
    },
    [prohibitedKeywords, toast],
  );

  const handleManualSubmit = useCallback(
    (data: z.infer<typeof manualProductSchema>) => {
      // Create a new product with initial values
      const newProduct: ProductDescription = {
        product: data.product,
        asin: data.asin,
        description: sanitizeHtml(data.description), // Sanitize the description
        characterCount: data.description.length,
        keywordCount: countKeywords(data.description, prohibitedKeywords),
        score: calculateScore(data.description, prohibitedKeywords),
      };

      // Add the new product to the products state
      setProducts((prevProducts) => [...prevProducts, newProduct]);
      toast({
        title: 'Product Added',
        description: `Added product: ${data.product}`,
        variant: 'default',
      });
    },
    [prohibitedKeywords, toast],
  );

  const handleDescriptionUpdate = useCallback(
    (productId: string, newDescription: string) => {
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          if (p.product === productId) {
            return {
              ...p,
              description: newDescription,
              characterCount: newDescription.length,
              keywordCount: countKeywords(newDescription, prohibitedKeywords),
              score: calculateScore(newDescription, prohibitedKeywords),
            };
          }
          return p;
        }),
      );
    },
    [prohibitedKeywords],
  );

  const handleSave = useCallback(
    (productToSave: ProductDescription) => {
      // Basic validation - check for empty description
      if (!productToSave.description) {
        toast({
          title: 'Save Error',
          description: 'Description cannot be empty.',
          variant: 'destructive',
        });
        return;
      }

      // Update the product in the products state
      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.product === productToSave.product ? productToSave : p,
        ),
      );
      toast({
        title: 'Product Saved',
        description: `Saved changes to ${productToSave.product}`,
        variant: 'default',
      });
      logger.info(`Saved product description for ${productToSave.product}`, {
        product: productToSave.product,
        component: 'DescriptionEditor',
      });
    },
    [toast],
  );

  const handleExport = useCallback(() => {
    // Prepare data for CSV export
    const csvData = products.map((product) => ({
      Product: product.product,
      ASIN: product.asin,
      Description: product.description,
      'Character Count': product.characterCount,
      'Keyword Count': product.keywordCount,
      Score: product.score,
    }));

    // Convert to CSV format
    const csv = Papa.unparse(csvData);

    // Create a download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product_descriptions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [products]);

  const clearData = useCallback(() => {
    setProducts([]);
    setActiveProductId(undefined);
    setError(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
    }
    toast({
      title: 'Data Cleared',
      description: 'All product data has been cleared.',
      variant: 'default',
    });
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Data Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <DataCard>
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload CSV</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import product data from a CSV file
              </p>
            </div>
            <div className="w-full">
              <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  Click or drag CSV file here
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Requires: product, description, asin)
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
                  dataType="description"
                  fileName="sample-product-descriptions.csv"
                />
              </div>
            </div>
          </div>
        </DataCard>

        {/* Manual Add */}
        <DataCard>
          <ManualAddProductForm
            onSubmit={handleManualSubmit}
            isLoading={isLoading}
          />
        </DataCard>
      </div>

      {/* Data Management Section */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExport} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
        <Button variant="destructive" onClick={clearData} disabled={isLoading}>
          Clear All
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Product List and Editor */}
      {products.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-medium mb-4">Product Descriptions</h2>
            <div className="space-y-4">
              {products.map((product) => (
                <Badge
                  key={product.product}
                  variant={
                    activeProductId === product.product
                      ? 'secondary'
                      : 'outline'
                  }
                  onClick={() => setActiveProductId(product.product)}
                  className="cursor-pointer break-words"
                >
                  {product.product}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeProduct && (
        <Card>
          <ProductEditorArea
            product={activeProduct}
            prohibitedKeywords={prohibitedKeywords}
            onDescriptionChange={handleDescriptionUpdate}
            onSave={handleSave}
          />
        </Card>
      )}
    </div>
  );
}
