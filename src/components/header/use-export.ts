import { useState } from 'react';

interface UseExportResult {
  // Defines the structure of the return value of the useExport hook
  isDownloading: boolean; // Whether the file is currently being downloaded
  handleExportClick: () => Promise<void>; // Function to handle the export click
}

export const useExport = (): UseExportResult => {
  // Manages the export functionality
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExportClick = async () => {
    // Handles the export click
    try {
      setIsDownloading(true);
      const response = await fetch('/api/download'); // Fetch the PDF from the API
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Wesley_Quintero_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Handle errors during export
      console.error('Failed to download resume:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return { isDownloading, handleExportClick };
};
