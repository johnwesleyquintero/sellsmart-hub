"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface BuildReport {
  severity: string;
  status: string;
  description: string;
  environment: string[];
  buildLogs: string[];
}

const defaultBuildReport: BuildReport = {
  severity: "",
  status: "",
  description: "",
  environment: [],
  buildLogs: [],
};

const severityLevels = ["Low", "Medium", "High"];
const statuses = ["Passed", "Failed", "Pending"];
const descriptions = [
  "Build failed due to errors.",
  "Build succeeded without errors.",
];
const environments = ["Development", "Staging", "Production"];

export const BuildReportApp = () => {
  const [buildReport, setBuildReport] = useState(defaultBuildReport);
  const [markdownReport, setMarkdownReport] = useState("");
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [rawBuildLog, setRawBuildLog] = useState("");
  const [error, setError] = useState("");

  const parseBuildReport = (report: string) => {
    try {
      const lines = report.split("\n");
      const buildLogs: string[] = [];
      let severity = "";
      let status = "";
      let description = "";

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        if (trimmedLine.match(/error|exception|failure/i)) {
          buildLogs.push(trimmedLine);
          severity = severity || "High";
          status = status || "Failed";
          description = description || "Build failed due to errors.";
        } else if (trimmedLine.match(/warning/i)) {
          buildLogs.push(trimmedLine);
          severity = severity || "Medium";
        } else if (trimmedLine.match(/build\s+failed/i)) {
          status = "Failed";
          severity = severity || "High";
          description = description || "Build failed due to errors.";
        } else if (trimmedLine.match(/build\s+succeeded|build\s+completed/i)) {
          status = "Passed";
          severity = severity || "Low";
          description = description || "Build succeeded without errors.";
        } else if (trimmedLine.match(/\[info\]|\[debug\]|step\s+\d+/i)) {
          buildLogs.push(trimmedLine);
        }
      });

      setError("");

      setBuildReport({
        severity,
        status,
        description,
        environment: [selectedEnvironment],
        buildLogs,
      });
    } catch (err) {
      setError(
        "Failed to parse build report. Please check the format and try again.",
      );
      console.error("Parse error:", err);
    }
  };

  const formatAsMarkdown = () => {
    const markdown = `# Build Report
## Severity: ${selectedSeverity || buildReport.severity}
## Status: ${selectedStatus || buildReport.status}
## Description: ${selectedDescription || buildReport.description}
## Environment: ${selectedEnvironment}
## Build Logs:
${buildReport.buildLogs.map((log, index) => `${index + 1}. ${log}`).join("\n")}
## Additional Message:
${additionalMessage || "Please address and resolve any issues that are causing functionalities to break."}
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
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Paste and Parse Build Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={rawBuildLog}
            onChange={handlePaste}
            placeholder="Paste build log here"
            className="w-full h-32 p-2 border border-gray-300 rounded-md"
          />
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">
              Severity:
            </Label>
            <Select
              value={selectedSeverity || buildReport.severity}
              onValueChange={setSelectedSeverity}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">
              Status:
            </Label>
            <Select
              value={selectedStatus || buildReport.status}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">
              Description:
            </Label>
            <Select
              value={selectedDescription || buildReport.description}
              onValueChange={setSelectedDescription}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select description" />
              </SelectTrigger>
              <SelectContent>
                {descriptions.map((description) => (
                  <SelectItem key={description} value={description}>
                    {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">
              Environment:
            </Label>
            <Select
              value={selectedEnvironment}
              onValueChange={setSelectedEnvironment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((environment) => (
                  <SelectItem key={environment} value={environment}>
                    {environment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">
              Build Logs:
            </Label>
            <ol className="list-decimal pl-5">
              {buildReport.buildLogs.map((log, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {log}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-4">
            <Label className="block text-sm font-medium text-gray-700">
              Additional Message:
            </Label>
            <Input
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              placeholder="Enter additional message here"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button
              className="bg-blue-500 text-white"
              onClick={formatAsMarkdown}
              disabled={!rawBuildLog}
            >
              Format as Markdown
            </Button>
            <Button
              className="bg-green-500 text-white"
              onClick={handleCopy}
              disabled={!markdownReport}
            >
              Copy Markdown Report
            </Button>
          </div>
        </CardContent>
      </Card>
      {markdownReport && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Markdown Report</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-secondary/10 p-4 rounded-md">
              {markdownReport}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
