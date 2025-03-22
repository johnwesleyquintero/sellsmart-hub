
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { extractGoogleSheetId } from '@/utils/fileUtils';

interface GoogleSheetUploaderProps {
  onDataReady: (data: any[]) => void;
  uploadStatus: 'idle' | 'loading' | 'success' | 'error';
  setUploadStatus: (status: 'idle' | 'loading' | 'success' | 'error') => void;
}

export function GoogleSheetUploader({
  onDataReady,
  uploadStatus,
  setUploadStatus
}: GoogleSheetUploaderProps) {
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const { toast } = useToast();
  
  const fetchGoogleSheetMutation = useMutation({
    mutationFn: async (sheetUrl: string) => {
      // In a real application, this would connect to a backend service
      // that uses the Google Sheets API to fetch the data
      // For demo purposes, we'll simulate a delay and return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract sheet ID from URL
      extractGoogleSheetId(sheetUrl);
      
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
  
  return (
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
    </div>
  );
}
