import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

export default function DataCard({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <Card className={`flex-1 ${className}`}>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}
