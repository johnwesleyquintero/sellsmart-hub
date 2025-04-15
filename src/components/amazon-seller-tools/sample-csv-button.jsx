'use client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadSampleCsv } from '@/lib/generate-sample-csv';
export default function SampleCsvButton({ dataType, fileName, variant = 'outline', size = 'sm', className, }) {
    return (<Button variant={variant} size={size} className={className} onClick={() => downloadSampleCsv(dataType, fileName)}>
      <Download className="mr-2 h-4 w-4"/>
      Download Sample CSV
    </Button>);
}
