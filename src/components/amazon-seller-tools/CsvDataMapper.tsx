// src/components/amazon-seller-tools/CsvDataMapper.tsx
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemo, useState } from 'react';

// Use a generic type T for the metrics object structure.
// This makes the component reusable if you need to map to different structures later.
// The constraint `Record<string, any>` ensures T is an object-like type.
interface CsvDataMapperProps<T extends Record<string, any>> {
  csvHeaders: string[];
  // targetMetrics now uses keyof T for type safety
  targetMetrics: { key: keyof T; label: string; required: boolean }[];
  // onMappingComplete expects a mapping where keys are from T
  onMappingComplete: (mapping: Record<keyof T, string | null>) => void;
  onCancel: () => void;
  // Optional: Pass a title or description
  title?: string;
  description?: string;
}

// Use the generic type T in the component definition
const CsvDataMapper = <T extends Record<string, any>>({
  csvHeaders,
  targetMetrics,
  onMappingComplete,
  onCancel,
  title = 'Map CSV Columns', // Default title
  description = 'Please match the columns from your uploaded CSV file to the required dashboard metrics.', // Default description
}: CsvDataMapperProps<T>) => {
  // Initialize state dynamically based on targetMetrics keys
  const initialMapping = useMemo(() => {
    const mapping: Partial<Record<keyof T, string | null>> = {};
    targetMetrics.forEach((metric) => {
      mapping[metric.key] = null;
    });
    return mapping as Record<keyof T, string | null>; // Assert type after initialization
  }, [targetMetrics]);

  const [mapping, setMapping] = useState<Record<keyof T, string | null>>(
    initialMapping,
  );

  // Handler for Select component changes
  const handleMappingChange = (metricKey: keyof T, header: string) => {
    // Treat the placeholder value ('') as null
    setMapping((prevMapping) => ({
      ...prevMapping,
      [metricKey]: header === '' ? null : header,
    }));
  };

  // Check if all required fields are mapped
  const isMappingComplete = useMemo(() => {
    return targetMetrics.every((metric) => {
      // If the metric is required, it must have a non-null value in the mapping
      return !metric.required || mapping[metric.key] !== null;
    });
  }, [mapping, targetMetrics]);

  const handleSubmit = () => {
    if (isMappingComplete) {
      onMappingComplete(mapping);
    } else {
      // Optional: Add a toast or alert indicating required fields are missing
      console.warn('Please map all required fields.');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {targetMetrics.map((metric) => (
          <div
            key={metric.key as string}
            className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4"
          >
            <Label htmlFor={metric.key as string} className="sm:text-right">
              {metric.label}
              {metric.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
              {metric.required && (
                <span className="sr-only">(required)</span>
              )}{' '}
              {/* For screen readers */}
            </Label>
            <div className="sm:col-span-2">
              <Select
                value={mapping[metric.key] || ''} // Use empty string for placeholder compatibility
                onValueChange={(value) => handleMappingChange(metric.key, value)}
              >
                <SelectTrigger id={metric.key as string} className="w-full">
                  <SelectValue placeholder="-- Select CSV Header --" />
                </SelectTrigger>
                <SelectContent>
                  {/* Explicit placeholder item */}
                  <SelectItem value="__placeholder__" disabled>
                    -- Select CSV Header --
                  </SelectItem>
                  {/* Map available CSV headers */}
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isMappingComplete}>
          Confirm Mapping
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CsvDataMapper;
