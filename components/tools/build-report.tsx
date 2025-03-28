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
  severity: "Low" | "Medium" | "High";
  status: "Passed" | "Failed" | "Pending";
  description: string;
  environment: string[];
  buildLogs: Array<{
    timestamp: string;
    level: "info" | "warn" | "error";
    message: string;
  }>;
  metrics?: {
    duration: number;
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    coverage: number;
  };
}

const defaultBuildReport: BuildReport = {
  severity: "Low",
  status: "Pending",
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

  const parseBuildReport = async (report: string): Promise<void> => {
    try {
      const lines = report.split("\n");
      const buildLogs: BuildReport["buildLogs"] = [];
      let severity: BuildReport["severity"] = "Low";
      let status: BuildReport["status"] = "Pending";
      let description = "";
      let metrics = {
        duration: 0,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        coverage: 0,
      };

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Parse timestamps and log levels
        const timestampMatch = trimmedLine.match(/^\[(.*?)\]/);
        const timestamp = timestampMatch
          ? timestampMatch[1]
          : new Date().toISOString();

        let level: "info" | "warn" | "error" = "info";
        if (trimmedLine.match(/error|exception|failure/i)) {
          level = "error";
          severity = "High";
          status = "Failed";
        } else if (trimmedLine.match(/warning/i)) {
          level = "warn";
          severity = severity === "Low" ? "Medium" : severity;
        }

        // Extract metrics
        const durationMatch = trimmedLine.match(/Total time: (\d+(\.\d+)?)/i);
        if (durationMatch) {
          metrics.duration = parseFloat(durationMatch[1]);
        }

        const testsMatch = trimmedLine.match(
          /Tests run: (\d+), Passed: (\d+), Failed: (\d+)/i,
        );
        if (testsMatch) {
          metrics.testsRun = parseInt(testsMatch[1]);
          metrics.testsPassed = parseInt(testsMatch[2]);
          metrics.testsFailed = parseInt(testsMatch[3]);
        }

        const coverageMatch = trimmedLine.match(/Coverage: (\d+(\.\d+)?)%/i);
        if (coverageMatch) {
          metrics.coverage = parseFloat(coverageMatch[1]);
        }

        buildLogs.push({
          timestamp,
          level,
          message: trimmedLine,
        });
      }

      // Generate summary description
      description = generateDescription(status, metrics);

      setError("");
      setBuildReport({
        severity,
        status,
        description,
        environment: [selectedEnvironment],
        buildLogs,
        metrics,
      });
    } catch (err) {
      const error = err as Error;
      setError(`Failed to parse build report: ${error.message}`);
      console.error("Parse error:", error);
    }
  };

  const generateDescription = (
    status: BuildReport["status"],
    metrics: NonNullable<BuildReport["metrics"]>,
  ): string => {
    if (status === "Failed") {
      return `Build failed with ${metrics.testsFailed} failed tests. Coverage at ${metrics.coverage}%.`;
    }
    return `Build succeeded with ${metrics.testsPassed}/${metrics.testsRun} tests passing. Coverage at ${metrics.coverage}%.`;
  };

  const formatAsMarkdown = () => {
    const { buildLogs, metrics } = buildReport;

    const markdown = `# Build Report ${new Date().toISOString()}

## Summary
- **Severity:** ${selectedSeverity || buildReport.severity}
- **Status:** ${selectedStatus || buildReport.status}
- **Environment:** ${selectedEnvironment}
- **Duration:** ${metrics?.duration.toFixed(2)}s
- **Tests:** ${metrics?.testsPassed}/${metrics?.testsRun} passing (${metrics?.coverage}% coverage)

## Description
${selectedDescription || buildReport.description}

## Build Logs
${buildLogs
  .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
  .join("\n")}

## Additional Notes
${additionalMessage || "No additional notes."}
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
                  {log.message}
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
