import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
  children?: ReactNode;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  children,
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
          {children}
        </div>
        <div className={`p-3 ${iconBgColor} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}