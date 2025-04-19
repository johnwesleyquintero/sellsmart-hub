import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCallback, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { UnifiedDashboardHeader } from './UnifiedDashboardHeader';

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
  conversion_rate: number;
  inventory_level: number;
  review_rating: number;
}

interface DashboardLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  component: string;
}

const sampleMetrics: DashboardMetrics[] = [
  {
    date: '2024-01',
    sales: 12000,
    profit: 3600,
    acos: 25,
    impressions: 50000,
    clicks: 2500,
    conversion_rate: 4.2,
    inventory_level: 850,
    review_rating: 4.5,
  },
  {
    date: '2024-02',
    sales: 15000,
    profit: 4500,
    acos: 22,
    impressions: 55000,
    clicks: 2750,
    conversion_rate: 4.5,
    inventory_level: 720,
    review_rating: 4.6,
  },
  {
    date: '2024-03',
    sales: 18000,
    profit: 5400,
    acos: 20,
    impressions: 60000,
    clicks: 3000,
    conversion_rate: 4.8,
    inventory_level: 650,
    review_rating: 4.7,
  },
];

const defaultLayout: DashboardLayout[] = [
  { id: 'sales', x: 0, y: 0, w: 6, h: 2, component: 'SalesChart' },
  { id: 'ppc', x: 6, y: 0, w: 6, h: 2, component: 'PPCChart' },
  { id: 'inventory', x: 0, y: 2, w: 4, h: 2, component: 'InventoryStatus' },
  { id: 'reviews', x: 4, y: 2, w: 4, h: 2, component: 'ReviewsMetrics' },
  { id: 'conversion', x: 8, y: 2, w: 4, h: 2, component: 'ConversionMetrics' },
];

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics] = useState<DashboardMetrics[]>(sampleMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Implement real-time data refresh logic here
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated API call
    // Update metrics with new data
    setIsLoading(false);
  }, []);

  const handleExport = useCallback(() => {
    // Implement CSV export logic here
    console.log('Exporting dashboard data...');
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <UnifiedDashboardHeader
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Conversion Rate</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics[metrics.length - 1].conversion_rate}%
                </div>
                <div className="text-sm text-gray-500 mt-1">Last 30 Days</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Inventory Status</h3>
                <div className="text-3xl font-bold text-green-600">
                  {metrics[metrics.length - 1].inventory_level}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Units Available
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-2">Review Rating</h3>
                <div className="text-3xl font-bold text-yellow-600">
                  {metrics[metrics.length - 1].review_rating}
                </div>
                <div className="text-sm text-gray-500 mt-1">Average Rating</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">
                  Sales & Profit Trends
                </h3>
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
                    <Bar
                      dataKey="impressions"
                      fill="#8884d8"
                      name="Impressions"
                    />
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
