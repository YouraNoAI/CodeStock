import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface OnlineUser {
  id: number;
  userId: number;
  lastActive: string;
  currentPage: string;
  user: {
    id: number;
    username: string;
    userId: string;
    role: string;
  };
}

export default function OnlineUsers() {
  const [timeThreshold, setTimeThreshold] = useState(15 * 60 * 1000); // 15 minutes in milliseconds
  
  const { data: onlineUsers, isLoading, error, refetch } = useQuery<OnlineUser[]>({
    queryKey: ['/api/sessions/active', timeThreshold],
    refetchInterval: 60000, // Refetch every minute
  });
  
  useEffect(() => {
    // Update query with new threshold when it changes
    refetch();
  }, [timeThreshold, refetch]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Online Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">Error loading online users: {error.message}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="text-lg font-semibold">Online Users</CardTitle>
        <Button variant="link" className="text-sm text-blue-500 p-0">View All</Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-3 flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))
          ) : onlineUsers && onlineUsers.length > 0 ? (
            onlineUsers.map((session) => (
              <div key={session.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {session.user.username.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-800">{session.user.username}</p>
                  <p className="text-xs text-gray-500">
                    {session.currentPage || 'Unknown page'} • {formatTimeAgo(new Date(session.lastActive))}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No users currently online</p>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Total online:</span>
            <span className="font-medium text-gray-800">{onlineUsers?.length || 0} users</span>
          </div>
          <div className="mt-2 flex justify-between items-center text-sm">
            <span className="text-gray-500">Active in last hour:</span>
            <span className="font-medium text-gray-800">
              {onlineUsers?.filter(u => 
                new Date(u.lastActive).getTime() > Date.now() - 3600000
              ).length || 0} users
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} sec`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr`;
  return `${Math.floor(diffInSeconds / 86400)} days`;
}
