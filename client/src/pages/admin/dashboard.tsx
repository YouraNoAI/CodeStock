import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/admin-layout';
import StatsCard from '@/components/dashboard/stats-card';
import OnlineUsers from '@/components/dashboard/online-users';
import PageVisitChart from '@/components/dashboard/chart';
import ActivityTable from '@/components/dashboard/activity-table';
import { Users, FileText, FileCheck, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useEffect } from 'react';

export default function AdminDashboard() {
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/admin' });
  }, []);

  // Fetch page visit stats
  const { data: pageVisitStats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['/api/page-visits/stats'],
  });

  // Format data for the chart
  const chartData = pageVisitStats?.map(stat => ({
    name: stat.page,
    value: stat.count
  }));

  // Mock data for the activity table
  const activityData = [
    {
      id: 1,
      user: { id: 2, username: 'Lucy Kim', initials: 'LK' },
      action: 'Submitted Assignment',
      resource: 'JavaScript Basics',
      time: '5 minutes ago',
      status: 'completed' as const
    },
    {
      id: 2,
      user: { id: 3, username: 'John Smith', initials: 'JS' },
      action: 'Viewed Page',
      resource: 'React Hooks',
      time: '12 minutes ago',
      status: 'active' as const
    },
    {
      id: 3,
      user: { id: 1, username: 'Youra No AI', initials: 'YN' },
      action: 'Added Learning Material',
      resource: 'Express Middleware',
      time: '24 minutes ago',
      status: 'published' as const
    },
    {
      id: 4,
      user: { id: 4, username: 'Robert Thomson', initials: 'RT' },
      action: 'Started Assignment',
      resource: 'Express Routing',
      time: '35 minutes ago',
      status: 'in_progress' as const
    }
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Active Users"
          value="28"
          icon={<Users className="h-6 w-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-primary"
          changeValue={12}
          changeText="from last week"
        />
        
        <StatsCard
          title="Learning Materials"
          value="156"
          icon={<FileText className="h-6 w-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-secondary"
          changeValue={8}
          changeText="from last month"
        />
        
        <StatsCard
          title="Pending Assignments"
          value="42"
          icon={<FileCheck className="h-6 w-6" />}
          iconBgColor="bg-amber-100"
          iconColor="text-accent"
          changeValue={-5}
          changeText="from yesterday"
        />
        
        <StatsCard
          title="Online Users"
          value="13"
          icon={<Clock className="h-6 w-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-danger"
          changeValue={20}
          changeText="from an hour ago"
        />
      </div>
      
      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Page Visit Statistics */}
        <PageVisitChart
          data={chartData}
          isLoading={isLoadingStats}
          error={statsError as Error}
        />
        
        {/* Online Users */}
        <OnlineUsers />
      </div>
      
      {/* Recent Activity */}
      <ActivityTable
        data={activityData}
        isLoading={false}
        error={null}
      />
    </AdminLayout>
  );
}
