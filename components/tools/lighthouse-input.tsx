import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent, useState } from "react";

interface LighthouseInputProps {
  onDataSubmit: (data: any) => void;
}

export default function LighthouseInput({ onDataSubmit }: LighthouseInputProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");

  const handleJsonSubmit = () => {
    try {
      const parsedData = JSON.parse(jsonInput);
      setError("");
      onDataSubmit(parsedData);
    } catch (err) {
      setError("Invalid JSON format. Please check your input.");
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsedData = JSON.parse(content);
          setJsonInput(JSON.stringify(parsedData, null, 2));
          setError("");
        } else if (file.name.endsWith('.csv')) {
          // TODO: Add CSV parsing logic
          setError("CSV parsing coming soon!");
        } else {
          setError("Please upload a JSON or CSV file");
        }
      } catch (err) {
        setError("Error reading file. Please make sure it's valid JSON or CSV.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="json-input" className="text-sm font-medium">
          Paste Lighthouse JSON data or upload a file
        </label>
        <Textarea
          id="json-input"
          placeholder="Paste your Lighthouse JSON data here..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="min-h-[200px] font-mono"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="flex gap-4">
        <Button onClick={handleJsonSubmit}>
          Parse JSON
        </Button>
        <div>
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Upload File
          </Button>
        </div>
      </div>
    </div>
  );
}