import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type CsvDataMapperProps = {
  onMapComplete: (mappings: Record<string, string>) => void;
};

export function CsvDataMapper({ onMapComplete }: CsvDataMapperProps) {
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>(
    {},
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">CSV Column Mapping</h3>
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <span className="w-32">Title Column</span>
          <Select
            onValueChange={(value) =>
              setColumnMappings((prev) => ({ ...prev, title: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {/* Dynamically populated columns would go here */}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => onMapComplete(columnMappings)}>
          Map Columns
        </Button>
      </div>
    </div>
  );
}
