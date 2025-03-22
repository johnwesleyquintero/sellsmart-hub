
/**
 * Utility functions for file operations
 */

/**
 * Processes CSV data and converts it to an array of objects
 */
export const processCSVData = (csvData: string): Record<string, string>[] => {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  const data = lines.slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const values = line.split(',').map(value => value.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      return row;
    });
  
  return data;
};

/**
 * Converts data to CSV format and triggers download
 */
export const exportToCSV = (data: any[]): void => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Get headers from the first data object
  const headers = Object.keys(data[0]);
  
  // Create CSV content with headers
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(row => {
    const rowValues = headers.map(header => {
      // Handle values that might contain commas
      const value = row[header]?.toString() || '';
      return value.includes(',') ? `"${value}"` : value;
    });
    csvContent += rowValues.join(',') + '\n';
  });
  
  // Create a Blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `exported-data-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Extracts Google Sheet ID from URL
 */
export const extractGoogleSheetId = (sheetUrl: string): string => {
  const urlPattern = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = sheetUrl.match(urlPattern);
  
  if (!match) {
    throw new Error("Invalid Google Sheet URL");
  }
  
  return match[1];
};
