import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  Line,
  LineChart,
  Pie, 
  PieChart,
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  Cell
} from 'recharts';

export default function AdminStatistics() {
  const [timeRange, setTimeRange] = useState('7');
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/admin/statistics' });
  }, []);

  // Fetch page visits stats
  const { data: pageVisitStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/page-visits/stats'],
  });

  // Fetch users for reference
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Format data for the bar chart
  const pageVisitChartData = pageVisitStats?.map(stat => ({
    name: stat.page,
    visits: stat.count
  }));

  // Mock data for user activity over time (would be replaced with real API data)
  const userActivityData = [
    { date: '2023-06-01', activeUsers: 5, pageViews: 20 },
    { date: '2023-06-02', activeUsers: 7, pageViews: 35 },
    { date: '2023-06-03', activeUsers: 12, pageViews: 48 },
    { date: '2023-06-04', activeUsers: 10, pageViews: 52 },
    { date: '2023-06-05', activeUsers: 15, pageViews: 65 },
    { date: '2023-06-06', activeUsers: 18, pageViews: 70 },
    { date: '2023-06-07', activeUsers: 22, pageViews: 85 },
  ];

  // Mock data for content type distribution
  const contentTypeData = [
    { name: 'JavaScript', value: 35 },
    { name: 'React', value: 25 },
    { name: 'Node.js', value: 20 },
    { name: 'CSS', value: 15 },
    { name: 'HTML', value: 5 },
  ];

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <AdminLayout title="Platform Statistics">
      <div className="mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs defaultValue="pageVisits">
        <TabsList className="mb-6">
          <TabsTrigger value="pageVisits">Page Visits</TabsTrigger>
          <TabsTrigger value="userActivity">User Activity</TabsTrigger>
          <TabsTrigger value="contentStats">Content Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pageVisits">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Most Visited Pages</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="h-80">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : !pageVisitChartData || pageVisitChartData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">No page visit data available.</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pageVisitChartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="visits" name="Page Visits" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Page Visit Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : !pageVisitStats || pageVisitStats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No page visit data available.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageVisitStats.map((stat, index) => {
                        const totalVisits = pageVisitStats.reduce((sum, s) => sum + s.count, 0);
                        const percentage = (stat.count / totalVisits * 100).toFixed(1);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium truncate max-w-[200px]">
                              {stat.page}
                            </TableCell>
                            <TableCell className="text-right">{stat.count}</TableCell>
                            <TableCell className="text-right">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="userActivity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">User Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={userActivityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="activeUsers" 
                        name="Active Users" 
                        stroke="hsl(var(--chart-1))" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pageViews" 
                        name="Page Views" 
                        stroke="hsl(var(--chart-2))" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">User Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="h-80">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : !users || users.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">No user data available.</p>
                  </div>
                ) : (
                  <>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
                              { name: 'Students', value: users.filter(u => u.role === 'user').length }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
                              { name: 'Students', value: users.filter(u => u.role === 'user').length }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around mt-4">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Total Users</p>
                        <p className="text-xl font-bold">{users.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Admins</p>
                        <p className="text-xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Students</p>
                        <p className="text-xl font-bold">{users.filter(u => u.role === 'user').length}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contentStats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Content Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Average Time on Page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'JavaScript Basics', time: 8.5 },
                        { name: 'React Hooks', time: 12.3 },
                        { name: 'Express Routing', time: 7.1 },
                        { name: 'Node.js Intro', time: 9.8 },
                        { name: 'CSS Flexbox', time: 6.2 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="time" 
                        name="Avg. Time (minutes)" 
                        fill="hsl(var(--chart-3))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
