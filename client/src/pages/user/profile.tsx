import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserLayout from '@/components/layout/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  User, 
  Award, 
  GraduationCap, 
  FileCheck, 
  BookOpen, 
  BarChart3, 
  Clock, 
  Calendar, 
  CheckCircle, 
  PenLine,
  Bell,
  Settings
} from 'lucide-react';

export default function UserProfile() {
  const { user, logoutMutation } = useAuth();
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/profile' });
  }, []);

  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
  });

  // Fetch user's submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
  });

  // Fetch user awards
  const { data: userAwards, isLoading: isLoadingAwards } = useQuery({
    queryKey: ['/api/user-awards'],
  });

  // Fetch learning materials
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Calculate the user's activity stats
  const calculateStats = () => {
    if (!assignments || !submissions || !userAwards || !materials) {
      return {
        totalAssignments: 0,
        completedAssignments: 0,
        completionRate: 0,
        averageGrade: 0,
        totalAwards: 0,
        learningHours: 0
      };
    }
    
    const completedAssignments = submissions.length;
    const totalAssignments = assignments.length;
    const completionRate = totalAssignments > 0 
      ? Math.round((completedAssignments / totalAssignments) * 100) 
      : 0;
    
    // Calculate average grade
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, sub) => sum + sub.grade, 0) / gradedSubmissions.length)
      : 0;
    
    // Calculate estimated learning hours based on material read times
    const learningHours = Math.round(materials.reduce((sum, material) => sum + material.readTime, 0) / 60);
    
    return {
      totalAssignments,
      completedAssignments,
      completionRate,
      averageGrade,
      totalAwards: userAwards.length,
      learningHours
    };
  };

  // Get recent activities (mock data since we don't have a real activity log)
  const getRecentActivities = () => {
    const activities = [];
    
    // Add submissions as activities
    if (submissions) {
      submissions.forEach(submission => {
        const assignment = assignments?.find(a => a.id === submission.assignmentId);
        if (assignment) {
          activities.push({
            id: `submission-${submission.id}`,
            type: 'submission',
            title: `Submitted "${assignment.title}"`,
            date: new Date(submission.submittedAt),
            details: assignment.course
          });
        }
      });
    }
    
    // Add awards as activities
    if (userAwards) {
      userAwards.forEach(award => {
        activities.push({
          id: `award-${award.id}`,
          type: 'award',
          title: `Earned "${award.award.name}" award`,
          date: new Date(award.awardedAt),
          details: award.award.description
        });
      });
    }
    
    // Sort by date (newest first) and get top 5
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'submission':
        return <FileCheck className="h-5 w-5 text-primary" />;
      case 'award':
        return <Award className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date for activity timeline
  const formatActivityDate = (date) => {
    const now = new Date();
    const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const isLoading = isLoadingAssignments || isLoadingSubmissions || isLoadingAwards || isLoadingMaterials;
  const stats = calculateStats();
  const recentActivities = getRecentActivities();

  return (
    <UserLayout title="Profil Saya">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {user?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{user?.username}</CardTitle>
            <CardDescription className="flex justify-center gap-2 mt-1">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Pelajar
              </Badge>
              <Badge variant="outline">ID: {user?.userId}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Bergabung {new Date(user?.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  {isLoading ? (
                    <Skeleton className="h-4 w-32 inline-block" />
                  ) : (
                    `${stats.learningHours} jam konten pembelajaran`
                  )}
                </span>
              </div>
              
              <div className="flex items-center">
                <FileCheck className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  {isLoading ? (
                    <Skeleton className="h-4 w-32 inline-block" />
                  ) : (
                    `${stats.completedAssignments} tugas diselesaikan`
                  )}
                </span>
              </div>
              
              <div className="flex items-center">
                <Award className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  {isLoading ? (
                    <Skeleton className="h-4 w-32 inline-block" />
                  ) : (
                    `${stats.totalAwards} penghargaan diterima`
                  )}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
                Logout
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Average Grade</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="flex items-center">
                    <GraduationCap className="h-6 w-6 text-primary mr-2" />
                    <span className="text-2xl font-bold">{stats.averageGrade}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <div>
                    <div className="flex items-center mb-2">
                      <BarChart3 className="h-6 w-6 text-secondary mr-2" />
                      <span className="text-2xl font-bold">{stats.completionRate}%</span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Tabs for different sections */}
          <Tabs defaultValue="activity">
            <TabsList className="mb-4">
              <TabsTrigger value="activity">
                <Clock className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="awards">
                <Award className="h-4 w-4 mr-2" />
                Awards
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No activity yet</h3>
                      <p className="text-gray-500">Your recent activities will appear here.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-6 border-l-2 border-gray-200" />
                      <div className="space-y-6">
                        {recentActivities.map((activity, index) => (
                          <div key={activity.id} className="relative pl-12">
                            <div className="absolute left-4 -translate-x-1/2 h-8 w-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{activity.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatActivityDate(activity.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t">
                  <Button variant="ghost" size="sm" className="text-primary">
                    View All Activity
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="awards">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">My Awards</CardTitle>
                  <CardDescription>Achievements you've earned</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAwards ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : !userAwards || userAwards.length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">No awards yet</h3>
                      <p className="text-gray-500">Complete assignments to earn awards.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {userAwards.map((userAward) => (
                        <div 
                          key={userAward.id} 
                          className="flex flex-col items-center text-center p-3 border rounded-lg"
                          title={userAward.award.description}
                        >
                          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-amber-100 mb-2">
                            <span className="text-lg font-bold text-amber-600">{userAward.award.badge}</span>
                          </div>
                          <p className="text-xs font-medium truncate w-full" title={userAward.award.name}>
                            {userAward.award.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t">
                  <Button variant="ghost" size="sm" className="text-primary" asChild>
                    <a href="/awards">View All Awards</a>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Recent updates and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
                    <p className="text-gray-500">You're all caught up!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </UserLayout>
  );
}
