
import React, { useState } from 'react';
import { BarChart3, ChevronDown, DollarSign, TrendingUp, Package, ShoppingCart, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/FileUploader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  units: number;
}

interface ProductData {
  name: string;
  sales: number;
  percentage: number;
}

const SalesAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();
  const [showDataTable, setShowDataTable] = useState(false);
  
  // Mock data for the sales chart
  const [salesData, setSalesData] = useState<SalesData[]>([
    { date: 'May 1', revenue: 1250, orders: 42, units: 78 },
    { date: 'May 8', revenue: 1400, orders: 48, units: 85 },
    { date: 'May 15', revenue: 1800, orders: 52, units: 92 },
    { date: 'May 22', revenue: 1600, orders: 50, units: 88 },
    { date: 'May 29', revenue: 2100, orders: 65, units: 105 },
    { date: 'Jun 5', revenue: 1900, orders: 58, units: 96 },
    { date: 'Jun 12', revenue: 2300, orders: 70, units: 115 },
    { date: 'Jun 19', revenue: 2500, orders: 75, units: 120 },
    { date: 'Jun 26', revenue: 2700, orders: 80, units: 130 },
    { date: 'Jul 3', revenue: 3000, orders: 85, units: 140 },
    { date: 'Jul 10', revenue: 3200, orders: 90, units: 150 },
    { date: 'Jul 17', revenue: 3400, orders: 95, units: 160 },
  ]);
  
  // Mock data for top products
  const [productData, setProductData] = useState<ProductData[]>([
    { name: 'Wireless Headphones', sales: 9800, percentage: 28 },
    { name: 'Smart Watch', sales: 8200, percentage: 24 },
    { name: 'Phone Charger', sales: 5400, percentage: 16 },
    { name: 'Bluetooth Speaker', sales: 4100, percentage: 12 },
    { name: 'Power Bank', sales: 3500, percentage: 10 },
    { name: 'Other Products', sales: 3400, percentage: 10 },
  ]);
  
  const handleImportData = (data: any[]) => {
    // Check if this looks like sales data or product data by examining properties
    if (data[0] && (data[0].date || data[0].Date || data[0].DATE)) {
      // This appears to be sales data
      const importedSalesData: SalesData[] = data.map(item => ({
        date: item.date || item.Date || item.DATE || '',
        revenue: parseFloat(item.revenue || item.Revenue || item.REVENUE || 0),
        orders: parseInt(item.orders || item.Orders || item.ORDERS || 0),
        units: parseInt(item.units || item.Units || item.UNITS || 0)
      }));
      
      setSalesData(importedSalesData);
      setShowDataTable(true);
      
      toast({
        title: "Import Complete",
        description: `Imported ${importedSalesData.length} sales data records`,
      });
    } else if (data[0] && (data[0].product || data[0].Product || data[0].name || data[0].Name)) {
      // This appears to be product data
      const importedProductData: ProductData[] = data.map(item => ({
        name: item.product || item.Product || item.name || item.Name || '',
        sales: parseFloat(item.sales || item.Sales || item.SALES || 0),
        percentage: parseFloat(item.percentage || item.Percentage || calculatePercentage(item.sales || item.Sales || 0, data))
      }));
      
      setProductData(importedProductData);
      setShowDataTable(true);
      
      toast({
        title: "Import Complete",
        description: `Imported ${importedProductData.length} product data records`,
      });
    } else {
      toast({
        title: "Import Error",
        description: "Could not determine data format. Please use a compatible format.",
        variant: "destructive"
      });
    }
  };
  
  const calculatePercentage = (sales: number, data: any[]) => {
    const totalSales = data.reduce((sum, item) => sum + parseFloat(item.sales || item.Sales || 0), 0);
    return totalSales ? (sales / totalSales) * 100 : 0;
  };
  
  // Colors for the pie chart
  const COLORS = ['#3245ff', '#bc52ee', '#4FD1C5', '#2d3748', '#718096', '#a0aec0'];
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Calculate summary metrics
  const calculateSummary = () => {
    // Calculate real metrics from the current salesData
    const totalRevenue = salesData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = salesData.reduce((sum, item) => sum + item.orders, 0);
    const totalUnits = salesData.reduce((sum, item) => sum + item.units, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // For this demo, we'll use hardcoded trends
    return {
      totalRevenue,
      revenueTrend: 14.5,
      totalOrders,
      ordersTrend: 8.2,
      totalUnits,
      unitsTrend: 12.7,
      averageOrderValue,
      aovTrend: 5.3
    };
  };
  
  const summary = calculateSummary();
  
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last 12 Months';
      default: return 'Last 30 Days';
    }
  };
  
  // Fixed CustomTooltip component with proper null checks
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length || !payload[0]) {
      return null;
    }
    
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          <span className="font-medium">Revenue:</span> ${payload[0].value?.toLocaleString() || '0'}
        </p>
        <p className="text-sm">
          <span className="font-medium">Orders:</span> {payload[0].payload?.orders?.toLocaleString() || '0'}
        </p>
        <p className="text-sm">
          <span className="font-medium">Units Sold:</span> {payload[0].payload?.units?.toLocaleString() || '0'}
        </p>
      </div>
    );
  };
  
  return (
    <ToolLayout 
      title="Sales Analytics Dashboard" 
      icon={<BarChart3 className="h-6 w-6" />}
      description="Access basic sales analytics and trends to inform your business decisions."
    >
      <div className="space-y-6">
        <FileUploader 
          onDataReady={handleImportData}
          title="Import Sales Data"
          description="Upload a CSV file with your sales data or connect to a Google Sheet"
          data={[...salesData, ...productData]}
        />
        
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sales Overview</h2>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowDataTable(!showDataTable)}
            >
              {showDataTable ? "Hide Data Table" : "Show Data Table"}
            </Button>
            
            <Select
              value={timeRange}
              onValueChange={setTimeRange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Total Revenue
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(summary.totalRevenue)}
                  </h3>
                  <div className={`flex items-center text-xs mt-1 ${
                    summary.revenueTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.revenueTrend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(summary.revenueTrend)}% vs. previous period</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Total Orders
                  </p>
                  <h3 className="text-2xl font-bold">
                    {summary.totalOrders.toLocaleString()}
                  </h3>
                  <div className={`flex items-center text-xs mt-1 ${
                    summary.ordersTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.ordersTrend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(summary.ordersTrend)}% vs. previous period</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Units Sold
                  </p>
                  <h3 className="text-2xl font-bold">
                    {summary.totalUnits.toLocaleString()}
                  </h3>
                  <div className={`flex items-center text-xs mt-1 ${
                    summary.unitsTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.unitsTrend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(summary.unitsTrend)}% vs. previous period</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Average Order Value
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(summary.averageOrderValue)}
                  </h3>
                  <div className={`flex items-center text-xs mt-1 ${
                    summary.aovTrend >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {summary.aovTrend >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                    )}
                    <span>{Math.abs(summary.aovTrend)}% vs. previous period</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {showDataTable && (
          <Card>
            <CardContent className="p-4 pt-5 overflow-auto">
              <h3 className="font-medium mb-4">Imported Data</h3>
              {salesData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-2">Sales Data</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Units</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{formatCurrency(row.revenue)}</TableCell>
                          <TableCell>{row.orders}</TableCell>
                          <TableCell>{row.units}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {salesData.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      Showing 5 of {salesData.length} rows
                    </p>
                  )}
                </div>
              )}
              
              {productData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Product Data</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productData.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{formatCurrency(row.sales)}</TableCell>
                          <TableCell>{row.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {productData.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      Showing 5 of {productData.length} rows
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2">
            <CardContent className="p-4 pt-5">
              <h3 className="font-medium mb-4">Revenue Trend - {getTimeRangeLabel()}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`} 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#4FD1C5" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardContent className="p-4 pt-5">
              <h3 className="font-medium mb-4">Top Products by Revenue</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="sales"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend 
                      layout="vertical" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: '12px', bottom: 0 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingUp className="h-5 w-5 text-sellsmart-teal mr-2" />
            <h3 className="font-medium">Sales Insights</h3>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Your best selling product is {productData[0]?.name || 'Wireless Headphones'} at {formatCurrency(productData[0]?.sales || 9800)} in revenue</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Revenue has increased by {summary.revenueTrend}% compared to the previous period</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Your average order value has grown by {summary.aovTrend}%, suggesting successful upselling</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Tuesday and Wednesday show the highest order volume</span>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Premium features include historical data analysis, sales forecasting, product performance benchmarking, and advanced reporting tools.
            </p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
};

export default SalesAnalytics;
