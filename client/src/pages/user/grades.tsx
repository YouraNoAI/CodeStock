import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserLayout from '@/components/layout/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Book, BookOpen, GraduationCap, Award } from 'lucide-react';

export default function UserGrades() {
  const { user } = useAuth();
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/grades' });
  }, []);

  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
  });

  // Fetch user's submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
  });

  // Calculate average grade
  const calculateAverageGrade = () => {
    if (!submissions) return 0;
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    if (gradedSubmissions.length === 0) return 0;
    
    const sum = gradedSubmissions.reduce((total, submission) => total + submission.grade, 0);
    return Math.round(sum / gradedSubmissions.length);
  };

  // Calculate grade distribution for pie chart
  const getGradeDistribution = () => {
    if (!submissions) return [];
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    if (gradedSubmissions.length === 0) return [];
    
    const ranges = [
      { name: 'A (90-100)', range: [90, 100], count: 0, color: '#10B981' },
      { name: 'B (80-89)', range: [80, 89], count: 0, color: '#3B82F6' },
      { name: 'C (70-79)', range: [70, 79], count: 0, color: '#F59E0B' },
      { name: 'D (60-69)', range: [60, 69], count: 0, color: '#F97316' },
      { name: 'F (0-59)', range: [0, 59], count: 0, color: '#EF4444' }
    ];
    
    gradedSubmissions.forEach(submission => {
      const grade = submission.grade;
      const range = ranges.find(r => grade >= r.range[0] && grade <= r.range[1]);
      if (range) range.count++;
    });
    
    return ranges.filter(r => r.count > 0);
  };

  // Get subject performance for bar chart
  const getSubjectPerformance = () => {
    if (!submissions || !assignments) return [];
    
    const gradedSubmissions = submissions.filter(s => s.grade !== null && s.grade !== undefined);
    if (gradedSubmissions.length === 0) return [];
    
    // Group by course
    const courseGroups = {};
    
    gradedSubmissions.forEach(submission => {
      const assignment = assignments.find(a => a.id === submission.assignmentId);
      if (assignment) {
        if (!courseGroups[assignment.course]) {
          courseGroups[assignment.course] = {
            grades: [],
            name: assignment.course
          };
        }
        courseGroups[assignment.course].grades.push(submission.grade);
      }
    });
    
    // Calculate average grade for each course
    return Object.values(courseGroups).map(group => ({
      name: group.name,
      grade: Math.round(group.grades.reduce((sum, grade) => sum + grade, 0) / group.grades.length)
    }));
  };

  // Get letter grade based on number
  const getLetterGrade = (grade) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  // Get grade color class
  const getGradeColorClass = (grade) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-amber-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Calculate completion rate
  const calculateCompletionRate = () => {
    if (!assignments || !submissions || assignments.length === 0) return 0;
    
    const completedCount = submissions.length;
    const totalCount = assignments.length;
    
    return Math.round((completedCount / totalCount) * 100);
  };

  const isLoading = isLoadingAssignments || isLoadingSubmissions;
  const averageGrade = calculateAverageGrade();
  const gradeDistribution = getGradeDistribution();
  const subjectPerformance = getSubjectPerformance();

  return (
    <UserLayout title="My Grades">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Average Grade</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">
                    {averageGrade}% <span className={`text-lg ${getGradeColorClass(averageGrade)}`}>({getLetterGrade(averageGrade)})</span>
                  </h3>
                )}
              </div>
            </div>
            <div className="mt-4">
              {isLoading ? (
                <Skeleton className="h-2.5 w-full" />
              ) : (
                <Progress value={averageGrade} className="h-2.5" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <BookOpen className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Assignments Completed</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">
                    {submissions?.length || 0} / {assignments?.length || 0}
                  </h3>
                )}
              </div>
            </div>
            <div className="mt-4">
              {isLoading ? (
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
              <div className="flex-shrink-0 bg-amber-100 rounded-full p-3">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5">
                <p className="text-gray-500 text-sm">Best Subject</p>
                {isLoading || subjectPerformance.length === 0 ? (
                  <Skeleton className="h-7 w-32 mt-1" />
                ) : (
                  <h3 className="text-xl font-bold text-gray-800">
                    {subjectPerformance.sort((a, b) => b.grade - a.grade)[0]?.name || 'N/A'}
                  </h3>
                )}
              </div>
            </div>
            <div className="mt-4">
              {isLoading || subjectPerformance.length === 0 ? (
                <Skeleton className="h-2.5 w-full" />
              ) : (
                <Progress 
                  value={subjectPerformance.sort((a, b) => b.grade - a.grade)[0]?.grade || 0} 
                  className="h-2.5" 
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="table">
        <TabsList className="mb-6">
          <TabsTrigger value="table">Grade Table</TabsTrigger>
          <TabsTrigger value="analytics">Grade Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Grades</CardTitle>
              <CardDescription>Detailed breakdown of your scores</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : !submissions || submissions.length === 0 ? (
                <div className="text-center py-8">
                  <Book className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No grades yet</h3>
                  <p className="text-gray-500">Submit assignments to see your grades here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => {
                      const assignment = assignments?.find(a => a.id === submission.assignmentId);
                      if (!assignment) return null;
                      
                      return (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{assignment.title}</TableCell>
                          <TableCell>{assignment.course}</TableCell>
                          <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {submission.grade !== null && submission.grade !== undefined ? (
                              <span className={`font-medium ${getGradeColorClass(submission.grade)}`}>
                                {submission.grade}/100 ({getLetterGrade(submission.grade)})
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            {submission.grade !== null && submission.grade !== undefined ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Graded
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Breakdown of your grades by letter</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : gradeDistribution.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">No grades data available yet.</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance by Subject</CardTitle>
                <CardDescription>Average grades across different courses</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : subjectPerformance.length === 0 ? (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">No course performance data available yet.</p>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectPerformance}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          label={{ value: 'Grade (%)', angle: -90, position: 'insideLeft' }} 
                        />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="grade" 
                          name="Average Grade" 
                          fill="hsl(var(--chart-1))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </UserLayout>
  );
}
