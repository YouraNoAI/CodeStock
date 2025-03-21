import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import UserLayout from '@/components/layout/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar, Upload, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

// Form validation schema
const submissionSchema = z.object({
  fileUrl: z.string().min(5, 'File URL is required'),
  comment: z.string().optional(),
});

export default function UserAssignments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/assignments' });
  }, []);

  const form = useForm<z.infer<typeof submissionSchema>>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      fileUrl: '',
      comment: '',
    }
  });

  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
  });

  // Fetch user's submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions'],
  });

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: async (values: z.infer<typeof submissionSchema>) => {
      const submission = {
        ...values,
        assignmentId: selectedAssignment.id,
        userId: user?.id,
      };
      
      const res = await apiRequest('POST', '/api/submissions', submission);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: 'Assignment Submitted',
        description: 'Your assignment has been submitted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to submit assignment: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof submissionSchema>) => {
    submitMutation.mutate(values);
  };

  // Open submit dialog
  const handleSubmitAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  // Check if assignment is submitted
  const isSubmitted = (assignmentId: number) => {
    if (!submissions) return false;
    return submissions.some(s => s.assignmentId === assignmentId);
  };

  // Get submission status
  const getSubmissionStatus = (assignmentId: number) => {
    if (!submissions) return null;
    return submissions.find(s => s.assignmentId === assignmentId);
  };

  // Get status badge
  const getStatusBadge = (dueDate: string, assignmentId: number) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    // Check if assignment is submitted
    const submitted = isSubmitted(assignmentId);
    const submission = getSubmissionStatus(assignmentId);
    
    if (submitted && submission?.grade !== null && submission?.grade !== undefined) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Graded: {submission.grade}/100
        </Badge>
      );
    } else if (submitted) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Submitted
        </Badge>
      );
    } else if (due < now) {
      return (
        <Badge variant="destructive">
          Expired
        </Badge>
      );
    } else if (due.getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000) {
      // Less than 2 days remaining
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          Due Soon
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Active
        </Badge>
      );
    }
  };

  // Get card icons based on status
  const getCardIcon = (dueDate: string, assignmentId: number) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    // Check if assignment is submitted
    const submitted = isSubmitted(assignmentId);
    const submission = getSubmissionStatus(assignmentId);
    
    if (submitted && submission?.grade !== null && submission?.grade !== undefined) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    } else if (submitted) {
      return <CheckCircle className="h-6 w-6 text-blue-500" />;
    } else if (due < now) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    } else {
      return <FileText className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <UserLayout title="Assignments">
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="graded">Graded</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : assignments?.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No assignments found</h3>
              <p className="text-gray-500">There are no assignments available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments?.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        {getCardIcon(assignment.dueDate, assignment.id)}
                      </div>
                    </div>
                    <CardDescription>{assignment.course}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" /> 
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" /> 
                        <span className="text-sm text-gray-500">
                          {new Date() > new Date(assignment.dueDate) 
                            ? 'Past Due' 
                            : `Due in ${Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between items-center">
                    <div>
                      {getStatusBadge(assignment.dueDate, assignment.id)}
                    </div>
                    <Button 
                      onClick={() => handleSubmitAssignment(assignment)}
                      disabled={isSubmitted(assignment.id) || new Date() > new Date(assignment.dueDate)}
                    >
                      {isSubmitted(assignment.id) ? 'View Submission' : 'Submit'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments?.filter(a => 
                new Date(a.dueDate) > new Date() && !isSubmitted(a.id)
              ).length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No active assignments</h3>
                  <p className="text-gray-500">You've completed all your current assignments!</p>
                </div>
              ) : (
                assignments?.filter(a => 
                  new Date(a.dueDate) > new Date() && !isSubmitted(a.id)
                ).map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                          {getCardIcon(assignment.dueDate, assignment.id)}
                        </div>
                      </div>
                      <CardDescription>{assignment.course}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {assignment.description}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" /> 
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" /> 
                          <span className="text-sm text-gray-500">
                            {`Due in ${Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center">
                      <div>
                        {getStatusBadge(assignment.dueDate, assignment.id)}
                      </div>
                      <Button onClick={() => handleSubmitAssignment(assignment)}>
                        Submit
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="submitted">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments?.filter(a => {
                const submission = getSubmissionStatus(a.id);
                return submission && submission.grade === null;
              }).length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No submitted assignments</h3>
                  <p className="text-gray-500">You don't have any assignments waiting for grading.</p>
                </div>
              ) : (
                assignments?.filter(a => {
                  const submission = getSubmissionStatus(a.id);
                  return submission && submission.grade === null;
                }).map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                      <CardDescription>{assignment.course}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                        {assignment.description}
                      </p>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" /> 
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Upload className="h-4 w-4 mr-2 text-gray-500" /> 
                          <span className="text-sm text-gray-500">
                            Submitted on: {
                              new Date(getSubmissionStatus(assignment.id)?.submittedAt || '').toLocaleDateString()
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        Submitted
                      </Badge>
                      <Button variant="outline">
                        View Submission
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="graded">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments?.filter(a => {
                const submission = getSubmissionStatus(a.id);
                return submission && submission.grade !== null;
              }).length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No graded assignments</h3>
                  <p className="text-gray-500">You don't have any graded assignments yet.</p>
                </div>
              ) : (
                assignments?.filter(a => {
                  const submission = getSubmissionStatus(a.id);
                  return submission && submission.grade !== null;
                }).map((assignment) => {
                  const submission = getSubmissionStatus(assignment.id);
                  
                  return (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          </div>
                        </div>
                        <CardDescription>{assignment.course}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                          {assignment.description}
                        </p>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2" /> 
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Upload className="h-4 w-4 mr-2 text-gray-500" /> 
                            <span className="text-sm text-gray-500">
                              Submitted on: {
                                new Date(submission?.submittedAt || '').toLocaleDateString()
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-between items-center">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Grade: {submission?.grade}/100
                        </Badge>
                        <Button variant="outline">
                          View Feedback
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{selectedAssignment.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{selectedAssignment.course}</p>
              <p className="text-sm text-gray-500 mt-1">
                Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter link to your submission (e.g. Google Drive, GitHub)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Add any comments about your submission" 
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
}
