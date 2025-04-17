import { Card, CardContent } from '@/components/ui/card';

export default function DataCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex-1 ${className}`}>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}
