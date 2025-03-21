import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserLayout from '@/components/layout/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  BookOpen, 
  FileCheck, 
  Award, 
  ArrowRight, 
  Clock, 
  FileText, 
  GraduationCap 
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/' });
  }, []);

  // Fetch assignment submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
  });

  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
  });

  // Fetch learning materials
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Fetch user awards
  const { data: userAwards, isLoading: isLoadingAwards } = useQuery({
    queryKey: ['/api/user-awards'],
  });

  // Calculate completed assignments percentage
  const calculateCompletionRate = () => {
    if (!assignments || !submissions || assignments.length === 0) return 0;
    
    const completedCount = submissions.length;
    const totalCount = assignments.length;
    
    return Math.round((completedCount / totalCount) * 100);
  };

  // Calculate average grade
  const calculateAverageGrade = () => {
    if (!submissions || submissions.length === 0) return 0;
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const sum = gradedSubmissions.reduce((total, submission) => total + submission.grade, 0);
    return Math.round(sum / gradedSubmissions.length);
  };

  // Get upcoming assignments
  const getUpcomingAssignments = () => {
    if (!assignments) return [];
    
    const now = new Date();
    // Filter assignments with future due dates and sort by closest due date
    return assignments
      .filter(a => new Date(a.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3); // Get top 3
  };

  // Get recent learning materials
  const getRecentMaterials = () => {
    if (!materials) return [];
    
    // Sort by creation date (newest first) and get top 3
    return [...materials]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  };

  // Format date relative to now
  const formatDueDate = (dateString: string) => {
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Jatuh tempo hari ini';
    if (diffDays === 1) return 'Jatuh tempo besok';
    if (diffDays > 1) return `Jatuh tempo dalam ${diffDays} hari`;
    return 'Lewat jatuh tempo';
  };

  return (
    <UserLayout title="Dasbor">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <FileCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Tugas Selesai</p>
                {isLoadingSubmissions || isLoadingAssignments ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">
                    {submissions?.length || 0} / {assignments?.length || 0}
                  </h3>
                )}
              </div>
            </div>
            <div className="mt-4">
              {isLoadingSubmissions || isLoadingAssignments ? (
                <Skeleton className="h-2.5 w-full" />
              ) : (
                <Progress value={calculateCompletionRate()} className="h-2.5" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <GraduationCap className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Nilai Rata-rata</p>
                {isLoadingSubmissions ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">
                    {calculateAverageGrade()}%
                  </h3>
                )}
              </div>
            </div>
            <div className="mt-4">
              {isLoadingSubmissions ? (
                <Skeleton className="h-2.5 w-full" />
              ) : (
                <Progress value={calculateAverageGrade()} className="h-2.5" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-full p-3">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Penghargaan Diterima</p>
                {isLoadingAwards ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">
                    {userAwards?.length || 0}
                  </h3>
                )}
              </div>
            </div>
            <div className="mt-4">
              {isLoadingAwards ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                <div className="flex -space-x-2">
                  {userAwards?.slice(0, 5).map((userAward, index) => (
                    <div 
                      key={index} 
                      className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white" 
                      title={userAward.award.name}
                    >
                      <span className="text-xs text-blue-500">{userAward.award.badge}</span>
                    </div>
                  ))}
                  
                  {userAwards && userAwards.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white">
                      <span className="text-xs text-gray-500">+{userAwards.length - 5}</span>
                    </div>
                  )}
                  
                  {(!userAwards || userAwards.length === 0) && (
                    <p className="text-sm text-gray-500 ml-2">Belum ada penghargaan. Terus belajar!</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Current Assignments */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Tugas Saat Ini</CardTitle>
            <CardDescription>Pekerjaan mendatang Anda</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/assignments">
              Lihat Semua <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingAssignments ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : getUpcomingAssignments().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada tugas mendatang.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getUpcomingAssignments().map((assignment) => {
                // Check if user has submitted this assignment
                const hasSubmitted = submissions?.some(s => s.assignmentId === assignment.id);
                
                return (
                  <div key={assignment.id} className="flex items-center p-3 border rounded-lg">
                    <div className="flex-shrink-0 mr-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium text-gray-800">{assignment.title}</h4>
                      <p className="text-xs text-gray-500">{assignment.course}</p>
                    </div>
                    <div className="flex-shrink-0 text-right mr-4">
                      <p className="text-xs text-amber-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDueDate(assignment.dueDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button size="sm" variant={hasSubmitted ? "outline" : "default"}>
                        {hasSubmitted ? 'Lihat' : 'Mulai'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Learning Materials */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Materi Pembelajaran Terbaru</CardTitle>
            <CardDescription>Konten pendidikan terkini</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/materials">
              Jelajahi Semua <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingMaterials ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : getRecentMaterials().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada materi pembelajaran tersedia.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getRecentMaterials().map((material) => (
                <div key={material.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-2">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-800">{material.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {material.content.length > 100 
                          ? `${material.content.substring(0, 100)}...` 
                          : material.content}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span>{material.category}</span>
                        <span className="mx-2">•</span>
                        <span>{material.readTime} menit membaca</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {material.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </UserLayout>
  );
}
