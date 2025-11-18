'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKeys: { key: string; color: string; name: string }[];
  title?: string;
  height?: number;
  stacked?: boolean;
}

export function BarChart({
  data,
  xKey,
  yKeys,
  title,
  height = 300,
  stacked = false,
}: BarChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={item.color}
              name={item.name}
              stackId={stacked ? 'a' : undefined}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
