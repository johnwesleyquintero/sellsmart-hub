# Dev Tools Suite

# Paste and Parse Build Report

A text area is provided for users to paste the build report.
The parseBuildReport function extracts relevant information from the build report, such as Severity, Status, Description, Environment details, and Build Logs.
Display Organized Report

The parsed report is displayed in an organized format using Shadcn UI components and Tailwind CSS for styling.
Dropdown menus are added for Severity Level, Status, Description, and Environment to allow users to choose templates.
The environment details are displayed as a selected value from the Environment dropdown menu.
The constant resolution steps are displayed next to the environment section.
The build logs are dynamically extracted from the build report and displayed in an ordered list.
An "Additional Message" section is added where users can input a custom message. If no message is provided, it defaults to "Please address and resolve any issues that are causing functionalities to break."
Dynamic messages are used to display the parsed information clearly.
Copy as Markdown

A button is provided to copy the organized report as a Markdown string.
The formatAsMarkdown function formats the parsed report as a Markdown string, using the selected values from the dropdown menus and the additional message.
The Clipboard API is used to copy the Markdown string to the clipboard.
Implementation Details

The implementation is focused on its core functionality and provides a good user experience with a clean and organized design.
The dropdown menus allow users to customize the severity, status, description, and environment before copying the Markdown report.
The "Additional Message" section allows users to provide custom messages.
Technical Details

The implementation uses React as the front-end framework and Shadcn UI components for styling.
The parseBuildReport function uses regular expressions to extract relevant information from the build report.
The formatAsMarkdown function uses template literals to format the parsed report as a Markdown string.
The Clipboard API is used to copy the Markdown string to the clipboard.
Future Enhancements

Add support for multiple build log formats.
Implement a more robust parsing logic to handle different build log formats.
Add more customization options for the Markdown report.
Integrate with other tools and services to provide a more comprehensive solution.

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

# Example Implementation
Here's an example implementation of the Build Report App using React and Shadcn UI components:
```tsx
import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "/components/ui";

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

const BuildReportApp = () => {
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
            <Label>Status:</Label>
            <Select>
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
            <Label>Description:</Label>
            <Select>
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
            <Label>Environment:</Label>
            <Select>
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
            <Label>Build Logs:</Label>
            <ol>
              {buildReport.buildLogs.map((log, index) => (
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

</details>

## 🎮 Usage Examples


