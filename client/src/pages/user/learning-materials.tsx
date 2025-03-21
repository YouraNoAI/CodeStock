import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserLayout from '@/components/layout/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  BookOpen, 
  Clock, 
  Tag, 
  Calendar, 
  User, 
  ChevronRight,
  CheckCircle 
} from 'lucide-react';

export default function UserLearningMaterials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openMaterial, setOpenMaterial] = useState<any>(null);
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/materials' });
  }, []);

  // Fetch learning materials
  const { data: materials, isLoading } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Get unique categories from materials
  const getCategories = () => {
    if (!materials) return [];
    
    const categories = new Set(materials.map(m => m.category));
    return Array.from(categories);
  };

  // Filter materials based on search query and selected category
  const getFilteredMaterials = () => {
    if (!materials) return [];
    
    return materials.filter(material => {
      const matchesSearch = 
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        material.category.toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });
  };

  // Open material details
  const handleOpenMaterial = (material: any) => {
    setOpenMaterial(material);
    
    // Record page visit for this specific material
    apiRequest('POST', '/api/page-visits', { 
      page: `/materials/${material.id}` 
    });
  };

  return (
    <UserLayout title="Learning Materials">
      <div className="mb-6">
        <div className="relative mb-4">
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
        </div>
        
        <Tabs 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
          className="w-full overflow-auto"
        >
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="all">All</TabsTrigger>
            {getCategories().map((category) => (
              <TabsTrigger key={category} value={category.toLowerCase()}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {isLoading ? (
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
                <Skeleton className="h-4 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : getFilteredMaterials().length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No materials found</h3>
          <p className="text-gray-500">
            {searchQuery 
              ? `No results for "${searchQuery}". Try a different search term.` 
              : 'No learning materials are available in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredMaterials().map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{material.title}</span>
                  <Badge variant="outline" className="ml-2 whitespace-nowrap">
                    {material.category}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> 
                  {material.readTime} min read
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-4">
                  {material.content}
                </p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {new Date(material.createdAt).toLocaleDateString()}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => handleOpenMaterial(material)}
                >
                  Read <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Material detail dialog */}
      {openMaterial && (
        <Dialog open={!!openMaterial} onOpenChange={() => setOpenMaterial(null)}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{openMaterial.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-2 items-center pt-2">
                <Badge variant="outline" className="flex items-center">
                  <Tag className="h-3 w-3 mr-1" /> 
                  {openMaterial.category}
                </Badge>
                <span className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-3 w-3 mr-1" /> 
                  {openMaterial.readTime} min read
                </span>
                <span className="flex items-center text-gray-500 text-sm">
                  <Calendar className="h-3 w-3 mr-1" /> 
                  {new Date(openMaterial.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center text-gray-500 text-sm">
                  <User className="h-3 w-3 mr-1" /> 
                  Author ID: {openMaterial.authorId}
                </span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="prose prose-blue max-w-none py-4">
              {openMaterial.content.split('\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </UserLayout>
  );
}
