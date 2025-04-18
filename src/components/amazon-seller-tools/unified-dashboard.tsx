import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Import existing tool components
import AcosCalculator from './acos-calculator';
import DescriptionEditor from './description-editor';
import FbaCalculator from './fba-calculator';
import KeywordAnalyzer from './keyword-analyzer';
import KeywordDeduplicator from './keyword-deduplicator';
import ListingQualityChecker from './listing-quality-checker';
import PpcCampaignAuditor from './ppc-campaign-auditor';

interface DashboardMetrics {
  date: string;
  sales: number;
  profit: number;
  acos: number;
  impressions: number;
  clicks: number;
}

const sampleMetrics: DashboardMetrics[] = [
  { date: '2024-01', sales: 12000, profit: 3600, acos: 25, impressions: 50000, clicks: 2500 },
  { date: '2024-02', sales: 15000, profit: 4500, acos: 22, impressions: 55000, clicks: 2750 },
  { date: '2024-03', sales: 18000, profit: 5400, acos: 20, impressions: 60000, clicks: 3000 },
];

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics] = useState<DashboardMetrics[]>(sampleMetrics);

  const handleRefresh = useCallback(() => {
    // Implement real-time data refresh logic here
    console.log('Refreshing dashboard data...');
  }, []);

  const handleExport = useCallback(() => {
    // Implement CSV export logic here
    console.log('Exporting dashboard data...');
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Amazon Seller Tools Dashboard</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fba">FBA</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="listing">Listing</TabsTrigger>
          <TabsTrigger value="ppc">PPC</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="deduplicator">Deduplicator</TabsTrigger>
          <TabsTrigger value="acos">ACoS</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Sales & Profit Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      name="Sales"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profit"
                      stroke="#82ca9d"
                      name="Profit"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">PPC Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                    <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fba">
          <FbaCalculator />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordAnalyzer />
        </TabsContent>

        <TabsContent value="listing">
          <ListingQualityChecker />
        </TabsContent>

        <TabsContent value="ppc">
          <PpcCampaignAuditor />
        </TabsContent>

        <TabsContent value="description">
          <DescriptionEditor />
        </TabsContent>

        <TabsContent value="deduplicator">
          <KeywordDeduplicator />
        </TabsContent>

        <TabsContent value="acos">
          <AcosCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}