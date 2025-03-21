import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash, Eye } from 'lucide-react';

// Validation schema for assignment form
const assignmentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  course: z.string().min(2, 'Course is required'),
  dueDate: z.string().refine(val => new Date(val) > new Date(), {
    message: 'Due date must be in the future',
  })
});

export default function AdminAssignments() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/admin/assignments' });
  }, []);

  const form = useForm<z.infer<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      course: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    }
  });

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['/api/assignments'],
  });

  // Fetch assignment submissions for stats
  const { data: submissions } = useQuery({
    queryKey: ['/api/submissions'],
  });

  // Create or update assignment mutation
  const assignmentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof assignmentSchema>) => {
      if (editingId) {
        // Update existing assignment
        const res = await apiRequest('PUT', `/api/assignments/${editingId}`, {
          ...values,
          dueDate: new Date(values.dueDate)
        });
        return res.json();
      } else {
        // Create new assignment
        const res = await apiRequest('POST', `/api/assignments`, {
          ...values, 
          dueDate: new Date(values.dueDate)
        });
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
      toast({
        title: editingId ? 'Assignment Updated' : 'Assignment Created',
        description: editingId 
          ? 'The assignment has been updated successfully.' 
          : 'The assignment has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${editingId ? 'update' : 'create'} assignment: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: 'Assignment Deleted',
        description: 'The assignment has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete assignment: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof assignmentSchema>) => {
    assignmentMutation.mutate(values);
  };

  // Handle edit button click
  const handleEdit = (assignment: any) => {
    const dueDate = new Date(assignment.dueDate).toISOString().split('T')[0];

    form.reset({
      title: assignment.title,
      description: assignment.description,
      course: assignment.course,
      dueDate: dueDate
    });
    setEditingId(assignment.id);
    setIsDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle add new button click
  const handleAddNew = () => {
    form.reset({
      title: '',
      description: '',
      course: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  // Get submission stats for an assignment
  const getSubmissionStats = (assignmentId: number) => {
    if (!submissions) return { total: 0, graded: 0 };
    
    const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
    const total = assignmentSubmissions.length;
    const graded = assignmentSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length;
    
    return { total, graded };
  };

  // Get status badge based on due date
  const getStatusBadge = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (due.getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000) {
      // Less than 2 days remaining
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due Soon</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    }
  };

  return (
    <AdminLayout title="Assignments">
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="all">All Assignments</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Assignment
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Manage Assignments</CardTitle>
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
                <TabsContent value="all">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No assignments found. Create your first one!
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignments?.map((assignment) => {
                          const stats = getSubmissionStats(assignment.id);
                          return (
                            <TableRow key={assignment.id}>
                              <TableCell className="font-medium">{assignment.title}</TableCell>
                              <TableCell>{assignment.course}</TableCell>
                              <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {stats.graded}/{stats.total} submissions
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(assignment.dueDate)}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-500"
                                    onClick={() => handleDelete(assignment.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="active">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments?.filter(a => new Date(a.dueDate) > new Date()).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No active assignments found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignments?.filter(a => new Date(a.dueDate) > new Date())
                          .map((assignment) => {
                            const stats = getSubmissionStats(assignment.id);
                            return (
                              <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.title}</TableCell>
                                <TableCell>{assignment.course}</TableCell>
                                <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {stats.graded}/{stats.total} submissions
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(assignment.dueDate)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-500"
                                      onClick={() => handleDelete(assignment.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="expired">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Submissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments?.filter(a => new Date(a.dueDate) <= new Date()).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No expired assignments found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignments?.filter(a => new Date(a.dueDate) <= new Date())
                          .map((assignment) => {
                            const stats = getSubmissionStats(assignment.id);
                            return (
                              <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.title}</TableCell>
                                <TableCell>{assignment.course}</TableCell>
                                <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {stats.graded}/{stats.total} submissions
                                </TableCell>
                                <TableCell>
                                  <Badge variant="destructive">Expired</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-red-500"
                                      onClick={() => handleDelete(assignment.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Add/Edit Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Assignment' : 'Create New Assignment'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter assignment title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. JavaScript Basics, React Fundamentals" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter assignment description and instructions" 
                        className="min-h-[150px]" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={assignmentMutation.isPending}
                >
                  {assignmentMutation.isPending ? (
                    <>Saving...</>
                  ) : editingId ? (
                    <>Update Assignment</>
                  ) : (
                    <>Create Assignment</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
