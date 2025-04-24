import React from 'react';
('use client');

import DragDropArea from '@/components/ui/DragDropArea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SampleDataType from '@/types/sample-data-type';
import { FileText, Info } from 'lucide-react';
import { ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import SampleCsvButton from '../sample-csv-button';

interface ToolFormProps {
  onFileUpload: (file: File) => void;
  onManualSubmit?: (data: Record<string, string>) => void;
  isLoading: boolean;
  csvRequirements: string[];
  manualInputs?: Array<{
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    pattern?: string;
    required?: boolean;
  }>;
  sampleCsvProps?: {
    dataType: SampleDataType;
    fileName: string;
  };
  children?: ReactNode;
}

export default function ToolForm({
  onFileUpload,
  onManualSubmit,
  isLoading,
  csvRequirements,
  manualInputs,
  sampleCsvProps,
  children,
}: Readonly<ToolFormProps>) {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  };

  const { getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onManualSubmit || !manualInputs) return;

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    manualInputs.forEach((input) => {
      data[input.name] = formData.get(input.name) as string;
    });

    onManualSubmit(data);
  };

  return (
    <div className="space-y-6">
      {/* CSV Requirements */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Required columns:
            {csvRequirements.map((req) => (
              <code key={req} className="mx-1">
                {req}
              </code>
            ))}
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      <DragDropArea isDragActive={isDragActive}>
        <FileText className="mb-2 h-8 w-8 text-primary/60" />
        <span className="text-sm font-medium">Click to upload CSV</span>
        <input {...getInputProps()} disabled={isLoading} />
        <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
        {sampleCsvProps && (
          <SampleCsvButton
            dataType={sampleCsvProps.dataType}
            fileName={sampleCsvProps.fileName}
            className="mt-4"
          />
        )}
      </DragDropArea>

      {/* Manual Input Form */}
      {manualInputs && onManualSubmit && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {manualInputs.map((input) => (
            <div key={input.name} className="space-y-2">
              <label htmlFor={input.name} className="text-sm font-medium">
                {input.label}
              </label>
              <Input
                id={input.name}
                name={input.name}
                type={input.type || 'text'}
                placeholder={input.placeholder}
                required={input.required}
              />
            </div>
          ))}
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      )}

      {/* Additional Content */}
      {children}
    </div>
  );
}
