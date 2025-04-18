'use client';
import DragDropArea from '@/components/ui/DragDropArea';
import { Button } from '@/components/ui/button';
import { FileText, Info } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import SampleCsvButton from './sample-csv-button';

type UploaderProps = {
  onUploadSuccess: (data: CsvRow[]) => void;
  isLoading: boolean;
  onClear: () => void;
  hasData: boolean;
};

interface CsvRow {
  id: string;
  impressions: number;
  clicks: number;
}

export default function CsvUploader({
  onUploadSuccess,
  isLoading,
  onClear,
  hasData,
}: UploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file: File) => {
        const reader = new FileReader();

        reader.onabort = () => {
          console.log('file reading was aborted');
        };
        reader.onerror = () => {
          console.log('file reading has failed');
        };

        reader.onload = () => handleCsvParse(file, onUploadSuccess);

        reader.readAsText(file);
      });
    },
    [onUploadSuccess],
  );

  const { getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Required columns: <code>id</code>, <code>impressions</code>,
            <code>clicks</code>
          </p>
        </div>
      </div>

      <DragDropArea isDragActive={isDragActive}>
        <FileText className="mb-2 h-8 w-8 text-primary/60" />
        <span className="text-sm font-medium">Click to upload CSV</span>
        <input {...getInputProps()} disabled={isLoading} />
        <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
        <SampleCsvButton
          dataType="ppc"
          fileName="sample-ppc-campaign.csv"
          className="mt-4"
        />
      </DragDropArea>
      {hasData && (
        <Button variant="outline" onClick={onClear}>
          Clear Data
        </Button>
      )}
    </div>
  );
}
function handleCsvParse(
  file: File,
  onUploadSuccess: (data: CsvRow[]) => void,
): any {
  throw new Error('Function not implemented.');
}
