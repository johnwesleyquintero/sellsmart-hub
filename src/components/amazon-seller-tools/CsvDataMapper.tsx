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
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logError } from '@/lib/error-handling';
import { useMemo, useState } from 'react';
import { DashboardMetrics } from './unified-dashboard';

// Use a generic type T for the metrics object structure.
// This makes the component reusable if you need to map to different structures later.
// The constraint `Record<string, any>` ensures T is an object-like type.
/**
 * @interface CsvDataMapperProps
 * @description Interface for the CsvDataMapper component props.
 * @param {string[]} csvHeaders - The headers from the CSV file.
 * @param {object[]} targetMetrics - The metrics to map to the CSV headers.
 * @param {function} onMappingComplete - Callback function when the mapping is complete.
 * @param {function} onCancel - Callback function when the mapping is cancelled.
 * @param {string} title - The title of the component.
 * @param {string} description - The description of the component.
 * @param {function} onError - Callback function when an error occurs.
 */
interface CsvDataMapperProps {
  csvHeaders: string[];
  targetMetrics: {
    key: keyof DashboardMetrics;
    label: string;
    required: boolean;
  }[];
  onMappingComplete: (mapping: Record<keyof DashboardMetrics, string>) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  onError?: (error: string) => void;
}

type MetricMapping = Record<keyof DashboardMetrics, string>;

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Use the generic type T in the component definition
const CsvDataMapper: React.FC<CsvDataMapperProps> = ({
  csvHeaders,
  targetMetrics,
  onMappingComplete,
  onCancel,
  title = 'Map CSV Columns',
  description = 'Match columns from your CSV to the dashboard metrics. Required fields (*) must be mapped. Optional fields can be left unmapped.',
  onError,
}: CsvDataMapperProps) => {
  const validateMapping = (currentMapping: MetricMapping): ValidationResult => {
    const errors: string[] = [];

    if (!Array.isArray(csvHeaders)) {
      errors.push('Invalid props: csvHeaders must be an array');
      return { isValid: false, errors };
    }

    if (!Array.isArray(targetMetrics)) {
      errors.push('Invalid props: targetMetrics must be an array');
      return { isValid: false, errors };
    }

    for (const metric of targetMetrics) {
      if (metric == null || typeof metric !== 'object') {
        errors.push('Invalid props: each targetMetric must be an object');
        return { isValid: false, errors };
      }
      if (!('key' in metric && 'label' in metric && 'required' in metric)) {
        errors.push(
          'Invalid props: each targetMetric must have key, label, and required properties',
        );
        return { isValid: false, errors };
      }
    }

    // Check for duplicate mappings
    const mappedValues = Object.values(currentMapping).filter(Boolean);
    const uniqueMappedValues = new Set(mappedValues);
    if (mappedValues.length !== uniqueMappedValues.size) {
      errors.push('Multiple metrics cannot be mapped to the same CSV header');
    }

    // Check for required metrics
    const requiredErrors = targetMetrics
      .filter((metric) => metric.required && !currentMapping[metric.key])
      .map((metric) => `Required metric "${metric.label}" is not mapped`);

    if (requiredErrors.length > 0) {
      errors.push(...requiredErrors);
      errors.unshift('Required fields must be mapped:');
    }

    return { isValid: errors.length === 0, errors };
  };
  // Initialize state dynamically based on targetMetrics keys
  const initialMapping = useMemo(() => {
    const mapping: Partial<Record<keyof DashboardMetrics, string>> = {};
    targetMetrics.forEach((metric) => {
      mapping[metric.key] = '';
    });
    return mapping as Record<keyof DashboardMetrics, string>; // Assert type after initialization
  }, [targetMetrics]);

  const [mapping, setMapping] =
    useState<Record<keyof DashboardMetrics, string>>(initialMapping);

  // Handler for Select component changes
  const handleMappingChange = (
    metricKey: keyof DashboardMetrics,
    header: string,
  ) => {
    // Treat the placeholder value ('') as null
    setMapping((prevMapping) => ({
      ...prevMapping,
      [metricKey]: header === '' ? '' : header,
    }));
  };

  // Check if all REQUIRED fields are mapped. Optional fields don't affect completion.
  const isMappingComplete = useMemo(() => {
    return targetMetrics.every((metric) => {
      // If the metric is required, it must have a non-null value in the mapping
      return !metric.required || mapping[metric.key] !== '';
    });
  }, [mapping, targetMetrics]);

  const handleSubmit = () => {
    try {
      const validationResult = validateMapping(mapping);
      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors.join('\n');
        logError({
          component: 'CsvDataMapper',
          message: errorMessage,
          severity: 'medium',
        });
        onError?.(errorMessage);
        return;
      }
      onMappingComplete(mapping);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      logError({
        component: 'CsvDataMapper',
        message: errorMessage,
        error: error as Error,
      });
      onError?.(errorMessage);
    }
  };

  const handleReset = () => {
    setMapping(initialMapping);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {/* Use the potentially updated description prop */}
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isMappingComplete && (
          <div className="text-red-500 text-sm">
            Required fields must be mapped
          </div>
        )}
        {targetMetrics.map((metric) => (
          <div
            key={metric.key as string}
            className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4"
          >
            <Label htmlFor={metric.key as string} className="sm:text-right">
              {metric.label}
              {metric.required && <span className="text-red-500 ml-1">*</span>}
              {metric.required && (
                <span className="sr-only">(required)</span>
              )}{' '}
              {/* For screen readers */}
            </Label>
            <div className="sm:col-span-2">
              <Select
                value={mapping[metric.key] || ''} // Use empty string for placeholder compatibility
                onValueChange={(value) =>
                  handleMappingChange(metric.key, value)
                }
              >
                <SelectTrigger id={metric.key as string} className="w-full">
                  {/* Dynamic placeholder based on requirement */}
                  <SelectValue
                    placeholder={
                      metric.required
                        ? '-- Select CSV Header --'
                        : '-- Select Header (Optional) --'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {/* No explicit placeholder item needed, SelectValue handles it */}
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
        <Button variant="outline" onClick={handleReset}>
          Reset Mappings
        </Button>
        {/* Button is enabled as long as all REQUIRED fields are mapped */}
        <Button onClick={handleSubmit} disabled={!isMappingComplete}>
          Confirm Mapping
        </Button>
      </CardFooter>
    </Card>
  );
};

const CsvDataMapperWithErrorBoundary = (props: CsvDataMapperProps) => (
  <ErrorBoundary>
    <CsvDataMapper {...props} />
  </ErrorBoundary>
);

export default CsvDataMapperWithErrorBoundary;
