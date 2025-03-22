
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV } from '@/utils/fileUtils';

interface ExportButtonProps {
  data: any[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const { toast } = useToast();
  
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({
        title: "No data to export",
        description: "Please upload or connect to data first",
        variant: "destructive"
      });
      return;
    }

    try {
      exportToCSV(data);
      
      toast({
        title: "Export successful",
        description: `Exported ${data.length} rows of data to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button 
      onClick={handleExport}
      variant="outline"
      className="flex items-center gap-2"
      disabled={!data || data.length === 0}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
