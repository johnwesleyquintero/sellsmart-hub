'use client';

import React, { useState, useCallback } from 'react';
import CsvUploader from './CsvUploader';

interface CsvRow {
  [key: string]: string | number;
}

const PpcCampaignAuditor: React.FC = () => {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);

  const handleFileUpload = useCallback((data: any[]) => {
    setCsvData(data);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-bold">PPC Campaign Auditor</h2>
      <CsvUploader onUpload={handleFileUpload} />
      {csvData.length > 0 && (
        <div className="mt-4">
          <h3>Uploaded Data:</h3>
          <pre>{JSON.stringify(csvData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PpcCampaignAuditor;
