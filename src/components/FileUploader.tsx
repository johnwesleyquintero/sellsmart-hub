
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCloud, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onDataReady: (data: any[]) => void;
  allowedFileTypes?: string;
  maxFileSizeMB?: number;
  title?: string;
  description?: string;
  data?: any[];
}

export function FileUploader({
  onDataReady,
  allowedFileTypes = ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel",
  maxFileSizeMB = 5,
  title = "Upload Your Data",
  description = "Upload a CSV file or connect to a Google Sheet",
  data = []
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  
  const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
  
  const processCSVMutation = useMutation({
    mutationFn: async (csvData: string) => {
      // Process CSV data
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      
      const data = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
          const values = line.split(',').map(value => value.trim());
          const row: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          return row;
        });
      
      return data;
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      onDataReady(data);
      toast({
        title: "Success!",
        description: `Processed ${data.length} rows of data successfully.`,
      });
    },
    onError: (error) => {
      setUploadStatus('error');
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  const fetchGoogleSheetMutation = useMutation({
    mutationFn: async (sheetUrl: string) => {
      // In a real application, this would connect to a backend service
      // that uses the Google Sheets API to fetch the data
      // For demo purposes, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract sheet ID from URL
      const urlPattern = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const match = sheetUrl.match(urlPattern);
      
      if (!match) {
        throw new Error("Invalid Google Sheet URL");
      }
      
      // Mock data - in production this would come from Google Sheets API
      return [
        { "SKU": "ABC123", "Product Name": "Wireless Headphones", "Current Stock": "25", "Min Stock": "10" },
        { "SKU": "DEF456", "Product Name": "Smart Watch", "Current Stock": "15", "Min Stock": "5" },
        { "SKU": "GHI789", "Product Name": "Bluetooth Speaker", "Current Stock": "8", "Min Stock": "10" }
      ];
    },
    onSuccess: (data) => {
      setUploadStatus('success');
      onDataReady(data);
      toast({
        title: "Success!",
        description: `Connected to Google Sheet and processed ${data.length} rows of data.`,
      });
    },
    onError: (error) => {
      setUploadStatus('error');
      toast({
        title: "Error connecting to Google Sheet",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Check file size
    if (selectedFile.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxFileSizeMB}MB`,
        variant: "destructive"
      });
      return;
    }
    
    setFile(selectedFile);
    setUploadStatus('idle');
  };
  
  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploadStatus('loading');
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const csvData = e.target?.result as string;
        processCSVMutation.mutate(csvData);
      };
      
      reader.onerror = () => {
        setUploadStatus('error');
        toast({
          title: "Error reading file",
          description: "An error occurred while reading the file",
          variant: "destructive"
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      setUploadStatus('error');
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleGoogleSheetConnect = () => {
    if (!googleSheetUrl) {
      toast({
        title: "No URL provided",
        description: "Please enter a Google Sheet URL",
        variant: "destructive"
      });
      return;
    }
    
    setUploadStatus('loading');
    fetchGoogleSheetMutation.mutate(googleSheetUrl);
  };
  
  const resetFileUpload = () => {
    setFile(null);
    setUploadStatus('idle');
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "Please upload or connect to data first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get headers from the first data object
      const headers = Object.keys(data[0]);
      
      // Create CSV content with headers
      let csvContent = headers.join(',') + '\n';
      
      // Add data rows
      data.forEach(row => {
        const rowValues = headers.map(header => {
          // Handle values that might contain commas
          const value = row[header]?.toString() || '';
          return value.includes(',') ? `"${value}"` : value;
        });
        csvContent += rowValues.join(',') + '\n';
      });
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exported-data-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: `Exported ${data.length} rows of data to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="bg-white shadow-sm border-border mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {data && data.length > 0 && (
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="upload">CSV Upload</TabsTrigger>
            <TabsTrigger value="google">Google Sheets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            {file && uploadStatus !== 'loading' ? (
              <div className="border rounded-md p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-6 w-6 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={resetFileUpload}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleFileUpload}
                    className="bg-sellsmart-teal hover:bg-sellsmart-teal/90"
                    disabled={uploadStatus === 'loading'}
                  >
                    {uploadStatus === 'loading' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Process File'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={cn(
                  "border-2 border-dashed rounded-md p-6",
                  "flex flex-col items-center justify-center gap-2",
                  "cursor-pointer hover:border-sellsmart-teal/50 transition-colors"
                )}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <UploadCloud className="h-10 w-10 text-muted-foreground/60" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {uploadStatus === 'loading' ? (
                      'Processing file...'
                    ) : (
                      'Drag & drop or click to upload'
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports CSV files up to {maxFileSizeMB}MB
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept={allowedFileTypes}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadStatus === 'loading'}
                />
                {uploadStatus === 'loading' && (
                  <Loader2 className="mt-2 h-6 w-6 animate-spin text-sellsmart-teal" />
                )}
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>File processed successfully!</span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>Error processing file. Please try again.</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="google" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sheet-url" className="text-sm font-medium">
                  Google Sheet URL
                </label>
                <Input
                  id="sheet-url"
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  disabled={uploadStatus === 'loading'}
                />
                <p className="text-xs text-muted-foreground">
                  Make sure your Google Sheet is public or shared with our app
                </p>
              </div>
              
              <Button 
                onClick={handleGoogleSheetConnect}
                className="w-full bg-sellsmart-teal hover:bg-sellsmart-teal/90"
                disabled={uploadStatus === 'loading' || !googleSheetUrl}
              >
                {uploadStatus === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect to Google Sheet'
                )}
              </Button>
            </div>
            
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Connected and processed data successfully!</span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Error connecting to Google Sheet. Please check the URL and try again.</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
