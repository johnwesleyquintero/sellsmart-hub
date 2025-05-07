// src/components/amazon-seller-tools/DashboardMetricsDisplay.tsx
import { Card, CardContent } from '@/components/ui/card';

interface DashboardMetricsDisplayProps {
  conversionRate?: number;
  totalSales?: number;
  sessions?: number;
}

export function DashboardMetricsDisplay({
  conversionRate,
  totalSales,
  sessions,
}: DashboardMetricsDisplayProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <Card className="opacity-75">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
            Conversion Rate
          </h3>
          <p>{conversionRate}</p>
        </CardContent>
      </Card>
      <Card className="opacity-75">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
            Total Sales
          </h3>
          <p>{totalSales}</p>
        </CardContent>
      </Card>
      <Card className="opacity-75">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
            Sessions
          </h3>
          <p>{sessions}</p>
        </CardContent>
      </Card>
    </div>
  );
}
