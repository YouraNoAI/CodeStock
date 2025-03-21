import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, PencilLine } from 'lucide-react';
import { useEffect } from 'react';

const gradeSchema = z.object({
  grade: z.number().min(0).max(100)
});

export default function AdminGrades() {
  const { toast } = useToast();
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/admin/grades' });
  }, []);

  const form = useForm<z.infer<typeof gradeSchema>>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      grade: 0
    }
  });

  // Fetch all submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
  });

  // Fetch all assignments for reference
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
  });

  // Fetch all users for reference
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Update grade mutation
  const gradeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof gradeSchema>) => {
      const res = await apiRequest('PUT', `/api/submissions/${currentSubmission.id}`, {
        grade: values.grade
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      setIsGradingDialogOpen(false);
      toast({
        title: 'Grade Updated',
        description: 'The submission has been graded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to grade submission: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof gradeSchema>) => {
    gradeMutation.mutate(values);
  };

  // Handle grade button click
  const handleGrade = (submission: any) => {
    setCurrentSubmission(submission);
    form.reset({
      grade: submission.grade || 0
    });
    setIsGradingDialogOpen(true);
  };

  // Helper function to get assignment title
  const getAssignmentTitle = (assignmentId: number) => {
    const assignment = assignments?.find(a => a.id === assignmentId);
    return assignment ? assignment.title : 'Unknown Assignment';
  };

  // Helper function to get user name
  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  // Check if all data is loading
  const isLoading = isLoadingSubmissions || isLoadingAssignments || isLoadingUsers;

  return (
    <AdminLayout title="Grading System">
      <Tabs defaultValue="pending">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="graded">Graded</TabsTrigger>
            <TabsTrigger value="all">All Submissions</TabsTrigger>
          </TabsList>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Assignment Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <TabsContent value="pending">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions?.filter(s => !s.grade).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No pending submissions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions?.filter(s => !s.grade).map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{getUserName(submission.userId)}</TableCell>
                            <TableCell>{getAssignmentTitle(submission.assignmentId)}</TableCell>
                            <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                Pending
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button size="sm" onClick={() => handleGrade(submission)}>
                                  <PencilLine className="h-4 w-4 mr-1" />
                                  Grade
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="graded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions?.filter(s => s.grade).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No graded submissions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions?.filter(s => s.grade).map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{getUserName(submission.userId)}</TableCell>
                            <TableCell>{getAssignmentTitle(submission.assignmentId)}</TableCell>
                            <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                {submission.grade}/100
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleGrade(submission)}>
                                  <PencilLine className="h-4 w-4 mr-1" />
                                  Edit Grade
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="all">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No submissions found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        submissions?.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">{getUserName(submission.userId)}</TableCell>
                            <TableCell>{getAssignmentTitle(submission.assignmentId)}</TableCell>
                            <TableCell>{new Date(submission.submittedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              {submission.grade ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  {submission.grade}/100
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                <Button 
                                  variant={submission.grade ? "outline" : "default"}
                                  size="sm" 
                                  onClick={() => handleGrade(submission)}
                                >
                                  <PencilLine className="h-4 w-4 mr-1" />
                                  {submission.grade ? 'Edit Grade' : 'Grade'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Grading Dialog */}
      <Dialog open={isGradingDialogOpen} onOpenChange={setIsGradingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Grade Assignment</DialogTitle>
          </DialogHeader>
          {currentSubmission && (
            <div className="mb-4">
              <p className="text-sm font-medium">
                Student: <span className="font-normal">{getUserName(currentSubmission.userId)}</span>
              </p>
              <p className="text-sm font-medium">
                Assignment: <span className="font-normal">{getAssignmentTitle(currentSubmission.assignmentId)}</span>
              </p>
              <p className="text-sm font-medium">
                Submitted: <span className="font-normal">{new Date(currentSubmission.submittedAt).toLocaleString()}</span>
              </p>
              {currentSubmission.comment && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Student Comment:</p>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{currentSubmission.comment}</p>
                </div>
              )}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade (0-100)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={gradeMutation.isPending}
                >
                  {gradeMutation.isPending ? 'Saving...' : 'Save Grade'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}