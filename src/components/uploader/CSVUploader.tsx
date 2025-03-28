
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCloud, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { processCSVData } from '@/utils/fileUtils';

interface CSVUploaderProps {
  onDataReady: (data: any[]) => void;
  allowedFileTypes?: string;
  maxFileSizeMB?: number;
  uploadStatus: 'idle' | 'loading' | 'success' | 'error';
  setUploadStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void;
}

export function CSVUploader({
  onDataReady,
  allowedFileTypes = ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel",
  maxFileSizeMB = 5,
  uploadStatus,
  setUploadStatus
}: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert MB to bytes
  
  const processCSVMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return processCSVData(csvData);
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
  
  const resetFileUpload = () => {
    setFile(null);
    setUploadStatus('idle');
  };
  
  return (
    <div className="space-y-4">
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
    </div>
  );
}
