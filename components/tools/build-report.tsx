import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@/components/ui";
import { useState } from 'react';

interface BuildReport {
  severity: string;
  status: string;
  description: string;
  environment: string[];
  buildLogs: string[];
}

const defaultBuildReport: BuildReport = {
  severity: '',
  status: '',
  description: '',
  environment: [],
  buildLogs: [],
};

const severityLevels = ['Low', 'Medium', 'High'];
const statuses = ['Passed', 'Failed', 'Pending'];
const descriptions = ['Build failed due to errors.', 'Build succeeded without errors.'];
const environments = ['Development', 'Staging', 'Production'];

export const BuildReportApp = () => {
  const [buildReport, setBuildReport] = useState(defaultBuildReport);
  const [markdownReport, setMarkdownReport] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [rawBuildLog, setRawBuildLog] = useState('');

  const parseBuildReport = (report: string) => {
    const lines = report.split('\n');
    const buildLogs: string[] = [];
    let severity = '';
    let status = '';
    let description = '';

    lines.forEach((line) => {
      if (line.includes('Error:') || line.includes('Warning:')) {
        buildLogs.push(line.trim());
      } else if (line.includes('Build failed')) {
        status = 'Failed';
        severity = 'High';
        description = 'Build failed due to errors.';
      } else if (line.includes('Build succeeded')) {
        status = 'Passed';
        severity = 'Low';
        description = 'Build succeeded without errors.';
      }
    });

    setBuildReport({
      severity,
      status,
      description,
      environment: [selectedEnvironment],
      buildLogs,
    });
  };

  const formatAsMarkdown = () => {
    const markdown = `# Build Report
## Severity: ${selectedSeverity || buildReport.severity}
## Status: ${selectedStatus || buildReport.status}
## Description: ${selectedDescription || buildReport.description}
## Environment: ${selectedEnvironment}
## Build Logs:
${buildReport.buildLogs.map((log, index) => `${index + 1}. ${log}`).join('\n')}
## Additional Message:
${additionalMessage || 'Please address and resolve any issues that are causing functionalities to break.'}
`;
    setMarkdownReport(markdown);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const pastedText = e.target.value;
    setRawBuildLog(pastedText);
    parseBuildReport(pastedText);
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Paste and Parse Build Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={rawBuildLog}
            onChange={handlePaste}
            placeholder="Paste build log here"
            className="w-full h-32 p-2 border border-gray-300 rounded-md"
          />
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">Severity:</Label>
            <Select className="w-full">
              <SelectTrigger>
                <SelectValue placeholder={buildReport.severity} />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((level) => (
                  <SelectItem key={level} value={level} onClick={() => setSelectedSeverity(level)}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">Status:</Label>
            <Select className="w-full">
              <SelectTrigger>
                <SelectValue placeholder={buildReport.status} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status} onClick={() => setSelectedStatus(status)}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">Description:</Label>
            <Select className="w-full">
              <SelectTrigger>
                <SelectValue placeholder={buildReport.description} />
              </SelectTrigger>
              <SelectContent>
                {descriptions.map((description) => (
                  <SelectItem key={description} value={description} onClick={() => setSelectedDescription(description)}>
                    {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">Environment:</Label>
            <Select className="w-full">
              <SelectTrigger>
                <SelectValue placeholder={selectedEnvironment} />
              </SelectTrigger>
              <SelectContent>
                {environments.map((environment) => (
                  <SelectItem key={environment} value={environment} onClick={() => setSelectedEnvironment(environment)}>
                    {environment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">Build Logs:</Label>
            <ol className="list-decimal pl-5">
              {buildReport.buildLogs.map((log, index) => (
                <li key={index} className="text-sm text-gray-600">{log}</li>
              ))}
            </ol>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">Additional Message:</Label>
            <Input
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              placeholder="Enter additional message here"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <Button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md" onClick={formatAsMarkdown}>Format as Markdown</Button>
          <Button className="mt-2 bg-green-500 text-white py-2 px-4 rounded-md" onClick={handleCopy}>Copy Markdown Report</Button>
        </CardContent>
      </Card>
      {markdownReport && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Markdown Report</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{markdownReport}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};