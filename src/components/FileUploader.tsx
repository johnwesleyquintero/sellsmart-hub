
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CSVUploader } from './uploader/CSVUploader';
import { GoogleSheetUploader } from './uploader/GoogleSheetUploader';
import { ExportButton } from './uploader/ExportButton';

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
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  return (
    <Card className="bg-white shadow-sm border-border mb-6">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {data && data.length > 0 && (
            <ExportButton data={data} />
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="upload">CSV Upload</TabsTrigger>
            <TabsTrigger value="google">Google Sheets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <CSVUploader 
              onDataReady={onDataReady}
              allowedFileTypes={allowedFileTypes}
              maxFileSizeMB={maxFileSizeMB}
              uploadStatus={uploadStatus}
              setUploadStatus={setUploadStatus}
            />
          </TabsContent>
          
          <TabsContent value="google" className="space-y-4">
            <GoogleSheetUploader
              onDataReady={onDataReady}
              uploadStatus={uploadStatus}
              setUploadStatus={setUploadStatus}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
