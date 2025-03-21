import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartData {
  name: string;
  value: number;
}

interface PageVisitChartProps {
  data?: ChartData[];
  isLoading: boolean;
  error: Error | null;
}

export default function PageVisitChart({ data, isLoading, error }: PageVisitChartProps) {
  const [timeRange, setTimeRange] = useState('7');
  
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="text-lg font-semibold">Page Visit Statistics</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-80 w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : error ? (
          <div className="h-80 w-full bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-red-500">Error loading chart data: {error.message}</p>
            </div>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-80 w-full bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <p className="mt-4 text-gray-500 text-sm">No page visit data available.</p>
            </div>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Visits" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Most Visited</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {data && data[0] ? data[0].name : 'N/A'}
            </p>
            <p className="text-xs text-blue-500">
              {data && data[0] ? `${data[0].value} visits` : '0 visits'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Rising Page</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {data && data[1] ? data[1].name : 'N/A'}
            </p>
            <p className="text-xs text-green-500">+45% this week</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Least Visited</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {data && data.length > 0 ? data[data.length - 1].name : 'N/A'}
            </p>
            <p className="text-xs text-red-500">
              {data && data.length > 0 ? `${data[data.length - 1].value} visits` : '0 visits'}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Avg. Time on Page</p>
            <p className="text-sm font-medium text-gray-800">8m 42s</p>
            <p className="text-xs text-blue-500">+2% from last week</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
