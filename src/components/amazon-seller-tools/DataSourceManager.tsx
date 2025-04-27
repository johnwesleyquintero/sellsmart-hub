'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { useState } from 'react';
import { create } from 'zustand';

type DataSourceStatus = 'empty' | 'loading' | 'success' | 'error' | 'partial';

interface SourceData<T> {
  status: DataSourceStatus;
  data: T[] | null;
  fileName?: string;
  errorMessage?: string;
  warnings?: string[];
  processedAt?: Date;
}

interface ReportData {
  asin: string;
  keyword?: string;
  upc?: string;
  sku?: string;
  date: Date;
  cost?: number;
  sales?: number;
  units?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  conversionRate?: number;
  spend?: number;
  acos?: number;
  roas?: number;
}

interface DataSourceStore {
  sources: {
    sqp?: SourceData<ReportData>;
    business?: SourceData<ReportData>;
    ads?: SourceData<ReportData>;
  };
  joinedData?: SourceData<ReportData>;
  setSourceData: (
    type: 'sqp' | 'business' | 'ads',
    data: SourceData<ReportData>,
  ) => void;
  setJoinedData: (data: SourceData<ReportData>) => void;
  reset: () => void;
}

interface FilesState {
  sqp?: File;
  business?: File;
  ads?: File;
}

// Global state store using Zustand
interface SetState<T> {
  (partial: T | Partial<T> | ((state: T) => T | Partial<T>)): void;
}

export const useDataSourceStore = create<DataSourceStore>(
  (set: SetState<DataSourceStore>) => ({
    sources: {},
    setSourceData: (
      type: 'sqp' | 'business' | 'ads',
      data: SourceData<ReportData>,
    ) => {
      console.log({ type, data });
      set((state) => ({
        sources: { ...state.sources, [type]: data },
      }));
    },
    setJoinedData: (data: SourceData<ReportData>) => {
      console.log({ data });
      set({ joinedData: data });
    },
    reset: () => set({ sources: {}, joinedData: undefined }),
  }),
);

export default function DataSourceManager() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { setSourceData, setJoinedData, reset } = useDataSourceStore();
  const [files, setFiles] = useState<FilesState>({});

  const handleFileChange =
    (type: 'sqp' | 'business' | 'ads') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        setFiles((prev: FilesState) => ({
          ...prev,
          [type]: e.target.files![0],
        }));
      }
    };

  const handleProcess = async () => {
    if (!files.sqp && !files.business && !files.ads) {
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    if (files.sqp) formData.append('sqpReport', files.sqp);
    if (files.business) formData.append('businessReport', files.business);
    if (files.ads) formData.append('adsReport', files.ads);

    try {
      const response = await fetch('/api/process-data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process files');
      }

      const result = await response.json();

      // Update global state with processed data
      Object.entries(result.sources).forEach(([type, data]) => {
        setSourceData(type as 'sqp' | 'business' | 'ads', {
          ...(data as SourceData<ReportData>),
          fileName: files[type as keyof FilesState]?.name,
          processedAt: new Date(),
        });
      });

      if (result.joinedData) {
        setJoinedData({
          ...(result.joinedData as SourceData<ReportData>),
          processedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFiles(() => ({}));
    reset();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Data Source Manager</h2>
        <p className="text-muted-foreground">
          Upload your Amazon report files for centralized processing. Supported
          formats: CSV
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="font-medium">Search Query Performance Report</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange('sqp')}
            disabled={isProcessing}
            className="w-full"
          />
          {files.sqp && (
            <p className="text-sm text-muted-foreground">
              Selected: {files.sqp?.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="font-medium">Business Report</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange('business')}
            disabled={isProcessing}
            className="w-full"
          />
          {files.business && (
            <p className="text-sm text-muted-foreground">
              Selected: {files.business?.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="font-medium">Advertising Report</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange('ads')}
            disabled={isProcessing}
            className="w-full"
          />
          {files.ads && (
            <p className="text-sm text-muted-foreground">
              Selected: {files.ads?.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleProcess}
          disabled={
            isProcessing || (!files.sqp && !files.business && !files.ads)
          }
        >
          {isProcessing ? (
            <>
              <Spinner className="mr-2" />
              Processing...
            </>
          ) : (
            'Process Files'
          )}
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
          Reset
        </Button>
      </div>

      {isProcessing && (
        <Alert>
          <AlertDescription>
            Processing your files. This may take a few moments...
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
}
