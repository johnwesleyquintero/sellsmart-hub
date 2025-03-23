import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

interface ReportUploaderProps {
  onUploadComplete?: (data: any) => void;
}

export function ReportUploader({ onUploadComplete }: ReportUploaderProps) {
  const { toast } = useToast();
  const { uploadState, handleFileUpload, reset } = useFileUpload({
    onSuccess: (data) => {
      toast({
        title: 'Upload Complete',
        description: `Successfully processed ${data.fileName}`,
      });
      onUploadComplete?.(data);
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await handleFileUpload(acceptedFiles[0]);
    }
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6
          flex flex-col items-center justify-center gap-2
          cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          ${uploadState.status === 'uploading' ? 'pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadState.status === 'uploading' ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium">Processing file...</p>
              <p className="text-xs text-muted-foreground">Please wait while we analyze your data</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground/60" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports CSV files exported from Amazon Seller Central
              </p>
            </div>
          </>
        )}
      </div>

      {uploadState.status === 'uploading' && (
        <Progress value={uploadState.progress} className="h-1" />
      )}

      {uploadState.status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>File processed successfully!</span>
        </div>
      )}

      {uploadState.status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{uploadState.error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}