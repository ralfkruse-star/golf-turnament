'use client';

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  trend,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>

          {change !== undefined && (
            <div className="mt-2 flex items-center">
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()} {Math.abs(change)}%
              </span>
              {description && (
                <span className="ml-2 text-sm text-gray-500">{description}</span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
