import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { Clock, Eye, Users } from 'lucide-react';

export default function AdminUserMonitoring() {
  const [timeThreshold, setTimeThreshold] = useState("900000"); // Default 15 minutes in milliseconds
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/admin/users' });
  }, []);

  // Fetch active sessions
  const { data: activeSessions, isLoading: isLoadingActiveSessions } = useQuery({
    queryKey: ['/api/sessions/active', parseInt(timeThreshold)],
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch page visits
  const { data: pageVisits, isLoading: isLoadingPageVisits } = useQuery({
    queryKey: ['/api/page-visits/stats'],
  });

  // Get current page for a user
  const getUserCurrentPage = (userId: number) => {
    if (!activeSessions) return 'Offline';
    const session = activeSessions.find(s => s.userId === userId);
    return session ? session.currentPage || 'Unknown page' : 'Offline';
  };

  // Check if user is online
  const isUserOnline = (userId: number) => {
    if (!activeSessions) return false;
    return activeSessions.some(s => s.userId === userId);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <AdminLayout title="User Monitoring">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Active Users</CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {isLoadingActiveSessions ? <Skeleton className="h-8 w-16" /> : activeSessions?.length || 0}
            </div>
            <p className="text-sm text-gray-500">Users currently online</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">User Activity</CardTitle>
            <Clock className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {isLoadingPageVisits ? <Skeleton className="h-8 w-16" /> : pageVisits?.[0]?.count || 0}
            </div>
            <p className="text-sm text-gray-500">Page visits today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Total Users</CardTitle>
            <Users className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {isLoadingUsers ? <Skeleton className="h-8 w-16" /> : users?.length || 0}
            </div>
            <p className="text-sm text-gray-500">Registered in platform</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="online">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="online">Online Users</TabsTrigger>
            <TabsTrigger value="all">All Users</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500">Activity Threshold:</p>
            <Select value={timeThreshold} onValueChange={setTimeThreshold}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time threshold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300000">Last 5 minutes</SelectItem>
                <SelectItem value="900000">Last 15 minutes</SelectItem>
                <SelectItem value="3600000">Last 1 hour</SelectItem>
                <SelectItem value="86400000">Last 24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <TabsContent value="online">
              {isLoadingActiveSessions ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  {activeSessions?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No users are currently online.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Current Page</TableHead>
                          <TableHead>Last Activity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeSessions?.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                  <span className="text-sm font-medium text-gray-600">
                                    {session.user.username.substring(0, 2).toUpperCase()}
                                  </span>
                                </div>
                                {session.user.username}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={session.user.role === 'admin' ? 'default' : 'secondary'}>
                                {session.user.role === 'admin' ? 'Admin' : 'Student'}
                              </Badge>
                            </TableCell>
                            <TableCell>{session.currentPage || 'Unknown page'}</TableCell>
                            <TableCell>{formatTimeAgo(session.lastActive)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Online
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {isLoadingUsers ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Current Page</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                              <span className="text-sm font-medium text-gray-600">
                                {user.username.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            {user.username}
                          </div>
                        </TableCell>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'Student'}
                          </Badge>
                        </TableCell>
                        <TableCell>{getUserCurrentPage(user.id)}</TableCell>
                        <TableCell>
                          {isUserOnline(user.id) ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                              Offline
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </AdminLayout>
  );
}
