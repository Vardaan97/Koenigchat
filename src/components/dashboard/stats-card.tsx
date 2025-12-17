'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-primary',
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p
                className={cn(
                  'text-xs mt-1',
                  change.type === 'increase' && 'text-green-600',
                  change.type === 'decrease' && 'text-red-600',
                  change.type === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change.type === 'increase' && '+'}
                {change.type === 'decrease' && '-'}
                {Math.abs(change.value)}% from yesterday
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-full bg-slate-100', iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
