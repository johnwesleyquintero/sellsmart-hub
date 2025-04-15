'use client';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Search,
  Upload,
} from 'lucide-react';
import Papa from 'papaparse';
import { useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SampleCsvButton from './sample-csv-button';
const KeywordIntelligence = {
  analyzeBatch(keywords) {
    return __awaiter(this, void 0, void 0, function* () {
      // Simulate API response
      return keywords.map((keyword) => ({
        keyword,
        score: Math.random() * 100,
      }));
    });
  },
};
export default function KeywordAnalyzer() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const handleFileUpload = (event) =>
    __awaiter(this, void 0, void 0, function* () {
      var _a;
      const file =
        (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
      if (!file) return;
      setIsLoading(true);
      setError(null);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) =>
          __awaiter(this, void 0, void 0, function* () {
            if (result.errors.length > 0) {
              setError(
                `Error parsing CSV file: ${result.errors[0].message}. Please check the format.`,
              );
              setIsLoading(false);
              return;
            }
            try {
              // Process the parsed data
              const processedData = yield Promise.all(
                result.data
                  .filter((item) => item.product && item.keywords)
                  .map((item) =>
                    __awaiter(this, void 0, void 0, function* () {
                      const keywordArray =
                        typeof item.keywords === 'string'
                          ? item.keywords.split(',').map((k) => k.trim())
                          : Array.isArray(item.keywords)
                            ? item.keywords
                            : [];
                      // Parse search volume if available
                      const searchVolume = item.searchVolume
                        ? Number.parseInt(String(item.searchVolume))
                        : undefined;
                      // Get competition level if available
                      const competition = item.competition || undefined;
                      const analysis = yield KeywordIntelligence.analyzeBatch(
                        keywordArray || [],
                      );
                      return {
                        product: String(item.product),
                        keywords: keywordArray || [],
                        searchVolume,
                        competition,
                        analysis,
                        suggestions: analysis.map((a) => a.keyword),
                      };
                    }),
                  ),
              );
              if (processedData.length === 0) {
                setError(
                  'No valid data found in CSV. Please ensure your CSV has columns: product, keywords',
                );
                setIsLoading(false);
                return;
              }
              setProducts(processedData);
              setIsLoading(false);
            } catch (_a) {
              setError(
                'Failed to process CSV data. Please ensure your CSV has columns: product, keywords',
              );
              setIsLoading(false);
            }
          }),
        error: (error) => {
          setError(`Error parsing CSV file: ${error.message}`);
          setIsLoading(false);
        },
      });
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }
    setIsLoading(true);
    setError(null);
    {
      /* In a real implementation, this would call an API to get keyword data.
              For now, we'll create a simulated response */
    }
    setTimeout(() => {
      const newProduct = {
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
        competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      };
      setProducts([...products, newProduct]);
      setSearchTerm('');
      setIsLoading(false);
    }, 1500);
  };
  const handleExport = () => {
    if (products.length === 0) {
      setError('No data to export');
      return;
    }
    // Prepare data for CSV export
    const exportData = products.map((product) => {
      var _a;
      return {
        product: product.product,
        keywords: product.keywords.join(', '),
        suggestions:
          (_a = product.suggestions) === null || _a === void 0
            ? void 0
            : _a.join(', '),
        searchVolume: product.searchVolume || '',
        competition: product.competition || '',
      };
    });
    // Create CSV content
    const csv = Papa.unparse(exportData);
    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'keyword_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const clearData = () => {
    setProducts([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  return (
    <div className="space-y-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Your CSV file should have the following columns:{' '}
            <code>product</code>, <code>keywords</code> (comma-separated)
          </p>
          <p>
            Optional columns: <code>searchVolume</code>,{' '}
            <code>competition</code> (Low, Medium, High)
          </p>
          <p className="mt-1">
            Example: <code>product,keywords,searchVolume,competition</code>
            <br />
            <code>
              Wireless Earbuds,&quot;bluetooth earbuds, wireless headphones,
              earphones&quot;,135000,High
            </code>
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
                    ref={fileInputRef}
                  />
                </label>
                <div className="flex justify-center mt-4">
                  <SampleCsvButton
                    dataType="keyword"
                    fileName="sample-keyword-analyzer.csv"
                  />
                </div>
                {products.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={clearData}
                  >
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
          <Progress className="h-2" />
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
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold">{product.product}</h3>
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
                            product.competition === 'High'
                              ? 'destructive'
                              : product.competition === 'Medium'
                                ? 'default'
                                : 'secondary'
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
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.keywords.map((keyword, i) => (
                          <Badge key={i} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      {product.searchVolume && (
                        <div className="h-80 w-full">
                          <h4 className="mb-2 text-sm font-medium">
                            Keyword Performance
                          </h4>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                {
                                  name: 'Search Volume',
                                  value: product.searchVolume,
                                },
                              ]}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="value" fill="#8884d8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
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
