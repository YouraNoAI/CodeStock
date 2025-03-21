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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash, Trophy, UserPlus } from 'lucide-react';

// Award form validation schema
const awardSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  badge: z.string().min(1, 'Badge is required').max(3, 'Badge must be 3 characters or less')
});

// Assign award form validation schema
const assignAwardSchema = z.object({
  userId: z.number().min(1, 'User is required'),
  awardId: z.number().min(1, 'Award is required')
});

export default function AdminAwards() {
  const { toast } = useToast();
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/admin/awards' });
  }, []);

  // Award form
  const awardForm = useForm<z.infer<typeof awardSchema>>({
    resolver: zodResolver(awardSchema),
    defaultValues: {
      name: '',
      description: '',
      badge: ''
    }
  });

  // Assign award form
  const assignForm = useForm<z.infer<typeof assignAwardSchema>>({
    resolver: zodResolver(assignAwardSchema),
    defaultValues: {
      userId: 0,
      awardId: 0
    }
  });

  // Fetch awards
  const { data: awards, isLoading: isLoadingAwards } = useQuery({
    queryKey: ['/api/awards'],
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Fetch user awards
  const { data: userAwards } = useQuery({
    queryKey: ['/api/user-awards'],
  });

  // Create or update award mutation
  const awardMutation = useMutation({
    mutationFn: async (values: z.infer<typeof awardSchema>) => {
      if (editingId) {
        // Update existing award
        const res = await apiRequest('PUT', `/api/awards/${editingId}`, values);
        return res.json();
      } else {
        // Create new award
        const res = await apiRequest('POST', `/api/awards`, values);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/awards'] });
      setIsAwardDialogOpen(false);
      setEditingId(null);
      awardForm.reset();
      toast({
        title: editingId ? 'Award Updated' : 'Award Created',
        description: editingId 
          ? 'The award has been updated successfully.' 
          : 'The award has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${editingId ? 'update' : 'create'} award: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Delete award mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/awards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/awards'] });
      toast({
        title: 'Award Deleted',
        description: 'The award has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete award: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Assign award mutation
  const assignAwardMutation = useMutation({
    mutationFn: async (values: z.infer<typeof assignAwardSchema>) => {
      const res = await apiRequest('POST', `/api/user-awards`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-awards'] });
      setIsAssignDialogOpen(false);
      assignForm.reset();
      toast({
        title: 'Award Assigned',
        description: 'The award has been assigned to the user successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to assign award: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Handle award form submission
  const onAwardSubmit = (values: z.infer<typeof awardSchema>) => {
    awardMutation.mutate(values);
  };

  // Handle assign award form submission
  const onAssignSubmit = (values: z.infer<typeof assignAwardSchema>) => {
    assignAwardMutation.mutate(values);
  };

  // Handle edit button click
  const handleEdit = (award: any) => {
    awardForm.reset({
      name: award.name,
      description: award.description,
      badge: award.badge
    });
    setEditingId(award.id);
    setIsAwardDialogOpen(true);
  };

  // Handle delete button click
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this award?')) {
      deleteMutation.mutate(id);
    }
  };

  // Handle add new button click
  const handleAddNew = () => {
    awardForm.reset({
      name: '',
      description: '',
      badge: ''
    });
    setEditingId(null);
    setIsAwardDialogOpen(true);
  };

  // Handle assign award button click
  const handleAssignAward = () => {
    assignForm.reset({
      userId: 0,
      awardId: 0
    });
    setIsAssignDialogOpen(true);
  };

  // Get count of users who received an award
  const getAwardRecipientCount = (awardId: number) => {
    if (!userAwards) return 0;
    return userAwards.filter(ua => ua.awardId === awardId).length;
  };

  return (
    <AdminLayout title="Awards Management">
      <div className="flex justify-between items-center mb-6">
        <div className="space-x-2">
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Award
          </Button>
          <Button variant="outline" onClick={handleAssignAward}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Award
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Manage Awards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAwards ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Badge</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awards?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No awards found. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  awards?.map((award) => (
                    <TableRow key={award.id}>
                      <TableCell>
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-primary flex items-center justify-center font-semibold">
                          {award.badge}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{award.name}</TableCell>
                      <TableCell className="max-w-md truncate">{award.description}</TableCell>
                      <TableCell>{getAwardRecipientCount(award.id)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(award)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-500"
                            onClick={() => handleDelete(award.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Award form dialog */}
      <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Award' : 'Create New Award'}
            </DialogTitle>
          </DialogHeader>
          <Form {...awardForm}>
            <form onSubmit={awardForm.handleSubmit(onAwardSubmit)} className="space-y-4">
              <FormField
                control={awardForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Award Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. JavaScript Master" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={awardForm.control}
                name="badge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Text (1-3 characters)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. JS, PA, TP" maxLength={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={awardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter award description" 
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
                  disabled={awardMutation.isPending}
                >
                  {awardMutation.isPending ? (
                    <>Saving...</>
                  ) : editingId ? (
                    <>Update Award</>
                  ) : (
                    <>Create Award</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign award dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Award to User</DialogTitle>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select User</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingUsers ? (
                          <SelectItem value="loading" disabled>Loading users...</SelectItem>
                        ) : (
                          users?.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assignForm.control}
                name="awardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Award</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an award" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingAwards ? (
                          <SelectItem value="loading" disabled>Loading awards...</SelectItem>
                        ) : (
                          awards?.map((award) => (
                            <SelectItem key={award.id} value={award.id.toString()}>
                              {award.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={assignAwardMutation.isPending}
                >
                  {assignAwardMutation.isPending ? 'Assigning...' : 'Assign Award'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
