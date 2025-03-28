# Dev Tools Suite

## Paste and Parse Build Report

A text area is provided for users to paste the build report.
The `parseBuildReportApp` function extracts relevant information from the build report, such as Severity, Status, Description, Environment details, and Build Logs.

## Display Organized Report

The parsed report is displayed in an organized format using Shadcn UI components and Tailwind CSS for styling.
Dropdown menus are added for Severity Level, Status, Description, and Environment to allow users to choose templates.
The environment details are displayed as a selected value from the Environment dropdown menu.
The constant resolution steps are displayed next to the environment section.
The build logs are dynamically extracted from the build report and displayed in an ordered list.
An "Additional Message" section is added where users can input a custom message. If no message is provided, it defaults to "Please address and resolve any issues that are causing functionalities to break."
Dynamic messages are used to display the parsed information clearly.

## Copy as Markdown

A button is provided to copy the organized report as a Markdown string.
The `formatAsMarkdown` function formats the parsed report as a Markdown string, using the selected values from the dropdown menus and the additional message.
The Clipboard API is used to copy the Markdown string to the clipboard.

## Implementation Details

The implementation is focused on its core functionality and provides a good user experience with a clean and organized design.
The dropdown menus allow users to customize the severity, status, description, and environment before copying the Markdown report.
The "Additional Message" section allows users to provide custom messages.

## Technical Details

- The implementation uses React as the front-end framework and Shadcn UI components for styling.
- The `parseBuildReportApp` function uses regular expressions to extract relevant information from the build report.
- The `formatAsMarkdown` function uses template literals to format the parsed report as a Markdown string.
- The Clipboard API is used to copy the Markdown string to the clipboard.

## Future Enhancements

- Add support for multiple build log formats.
- Implement a more robust parsing logic to handle different build log formats.
- Add more customization options for the Markdown report.
- Integrate with other tools and services to provide a more comprehensive solution.

---

# Integration with External Tools

The Build Report App can be integrated with various development tools and services to automate reporting and enhance team collaboration.

## Implementation Details

- **CI/CD Pipeline Integration**: Add webhook support to receive build status updates directly from Jenkins, CircleCI, or GitHub Actions
- **Version Control Systems**: Automatically create issues in Jira or GitHub when critical build failures are detected
- **Team Collaboration**: Post formatted reports to Slack/Microsoft Teams channels using incoming webhooks

## Technical Details

- REST API endpoints available for programmatic report generation
- Webhook support for real-time build notifications
- OAuth 2.0 integration for secure service connections

## Usage Examples

```bash
# Sample API request to generate report
curl -X POST https://api.example.com/reports \
  -H "Authorization: Bearer <token>" \
  -d @build_log.txt
```

---

# Example Implementation

Here's an example implementation of the Build Report App using React and Shadcn UI components:

```tsx
import { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "/components/ui";

interface BuildReportApp {
  severity: string;
  status: string;
  description: string;
  environment: string[];
  buildLogs: string[];
}

const defaultBuildReportApp: BuildReportApp = {
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

const BuildReportAppApp = () => {
  const [BuildReportApp, setBuildReportApp] = useState(defaultBuildReportApp);
  const [markdownReport, setMarkdownReport] = useState("");
  const [additionalMessage, setAdditionalMessage] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDescription, setSelectedDescription] = useState("");
  const [selectedEnvironment, setSelectedEnvironment] = useState("");
  const [rawBuildLog, setRawBuildLog] = useState("");

  // Helper functions to determine severity, status, and description
  const determineSeverity = (line: string): string => {
    if (line.includes("Error:")) return "High";
    if (line.includes("Warning:")) return "Medium";
    return "";
  };

  const determineStatus = (report: string): string => {
    if (report.includes("Build failed")) return "Failed";
    if (report.includes("Build succeeded")) return "Passed";
    return "";
  };

  const determineDescription = (report: string): string => {
    if (report.includes("Build failed")) return "Build failed due to errors.";
    if (report.includes("Build succeeded"))
      return "Build succeeded without errors.";
    return "";
  };

  const parseBuildReportApp = (report: string) => {
    const lines = report.split("\n");
    const buildLogs: string[] = [];
    let severity = "";
    let status = "";
    let description = "";

    lines.forEach((line) => {
      if (line.includes("Error:") || line.includes("Warning:")) {
        buildLogs.push(line.trim());
      }
    });

    status = determineStatus(report);
    severity = determineSeverity(report);
    description = determineDescription(report);

    setBuildReportApp({
      severity: severity || BuildReportApp.severity, // Use existing value if not found
      status: status || BuildReportApp.status, // Use existing value if not found
      description: description || BuildReportApp.description, // Use existing value if not found
      environment: [selectedEnvironment],
      buildLogs,
    });
  };

  const formatAsMarkdown = () => {
    const markdown = `# Build Report
## Severity: ${selectedSeverity || BuildReportApp.severity || "N/A"}
## Status: ${selectedStatus || BuildReportApp.status || "N/A"}
## Description: ${selectedDescription || BuildReportApp.description || "N/A"}
## Environment: ${selectedEnvironment || "N/A"}
## Build Logs:
${BuildReportApp.buildLogs
  .map((log, index) => `${index + 1}. ${log}`)
  .join("\n")}
## Additional Message:
${
  additionalMessage ||
  "Please address and resolve any issues that are causing functionalities to break."
}
`;
    setMarkdownReport(markdown);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
  };

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const pastedText = e.target.value;
    setRawBuildLog(pastedText);
    parseBuildReportApp(pastedText);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Paste and Parse Build Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={rawBuildLog}
            onChange={handlePaste}
            placeholder="Paste build log here"
          />
          <div className="mt-4">
            <Label>Severity:</Label>
            <Select>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedSeverity ||
                    BuildReportApp.severity ||
                    "Select Severity"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {severityLevels.map((level) => (
                  <SelectItem
                    key={level}
                    value={level}
                    onClick={() => setSelectedSeverity(level)}
                  >
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label>Status:</Label>
            <Select>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedStatus || BuildReportApp.status || "Select Status"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label>Description:</Label>
            <Select>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedDescription ||
                    BuildReportApp.description ||
                    "Select Description"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {descriptions.map((description) => (
                  <SelectItem
                    key={description}
                    value={description}
                    onClick={() => setSelectedDescription(description)}
                  >
                    {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label>Environment:</Label>
            <Select>
              <SelectTrigger>
                <SelectValue
                  placeholder={selectedEnvironment || "Select Environment"}
                />
              </SelectTrigger>
              <SelectContent>
                {environments.map((environment) => (
                  <SelectItem
                    key={environment}
                    value={environment}
                    onClick={() => setSelectedEnvironment(environment)}
                  >
                    {environment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Label>Build Logs:</Label>
            <ol>
              {BuildReportApp.buildLogs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ol>
          </div>
          <div className="mt-4">
            <Label>Additional Message:</Label>
            <Input
              value={additionalMessage}
              onChange={(e) => setAdditionalMessage(e.target.value)}
              placeholder="Enter additional message here"
            />
          </div>
          <Button onClick={formatAsMarkdown}>Format as Markdown</Button>
          <Button onClick={handleCopy}>Copy Markdown Report</Button>
        </CardContent>
      </Card>
      {markdownReport && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Markdown Report</CardTitle>
          </CardHeader>
          <CardContent>
            <pre>{markdownReport}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildReportApp;
```

This example implementation demonstrates how the Build Report App can be built using React and Shadcn UI components. It includes features such as parsing build reports, displaying organized reports, and copying as Markdown.

---

# Lighthouse Audit Report

The Lighthouse Audit Report is a web application that allows users to paste and parse build reports, display organized reports, and copy as Markdown. It also integrates with external tools for seamless reporting and collaboration.

## Features

- Paste and parse build reports

- Display organized reports

- Copy as Markdown

- Integration with external tools

## Implementation Details

- React as the front-end framework

- Shadcn UI components for styling

- Clipboard API for copying Markdown reports

- REST API endpoints for programmatic report generation

- Webhook support for real-time build notifications

- OAuth 2.0 integration for secure service connections

# Example Implementation

Here's an example implementation of the Lighthouse Audit Report using React and Shadcn UI components:

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LighthouseMetric {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
}

interface LighthouseAuditProps {
  metrics: {
    "first-contentful-paint": LighthouseMetric;
    "largest-contentful-paint": LighthouseMetric;
    "speed-index": LighthouseMetric;
    "is-on-https": LighthouseMetric;
    viewport: LighthouseMetric;
  };
}

export default function LighthouseAudit({ metrics }: LighthouseAuditProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-gray-300";
    if (score >= 0.9) return "bg-green-500";
    if (score >= 0.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatMetricValue = (metric: LighthouseMetric) => {
    if (metric.displayValue) return metric.displayValue;
    if (metric.numericValue && metric.numericUnit) {
      return `${metric.numericValue} ${metric.numericUnit}`;
    }
    return "N/A";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Lighthouse Audit Results</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(metrics).map(([id, metric]) => (
          <Card key={id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{metric.title}</h3>
                  <span className="text-sm">
                    {metric.score !== null
                      ? `${Math.round(metric.score * 100)}%`
                      : "N/A"}
                  </span>
                </div>
                <Progress
                  value={metric.score !== null ? metric.score * 100 : 0}
                  className={`h-2 ${getScoreColor(metric.score)}`}
                />
                <p className="text-sm text-muted-foreground">
                  {formatMetricValue(metric)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---
