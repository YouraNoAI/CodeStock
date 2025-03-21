import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserLayout from '@/components/layout/user-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Award, Medal, Trophy, StarIcon, Calendar, CheckCircle2 } from 'lucide-react';

export default function UserAwards() {
  const { user } = useAuth();
  
  // Record page visit
  useEffect(() => {
    apiRequest('POST', '/api/page-visits', { page: '/awards' });
  }, []);

  // Fetch user awards
  const { data: userAwards, isLoading: isLoadingUserAwards } = useQuery({
    queryKey: ['/api/user-awards'],
  });

  // Fetch all possible awards for reference
  const { data: allAwards, isLoading: isLoadingAllAwards } = useQuery({
    queryKey: ['/api/awards'],
  });

  // Get badge background color based on award name
  const getBadgeBackground = (awardName) => {
    if (awardName.toLowerCase().includes('javascript')) return 'bg-yellow-100 text-yellow-800';
    if (awardName.toLowerCase().includes('react')) return 'bg-blue-100 text-blue-800';
    if (awardName.toLowerCase().includes('node')) return 'bg-green-100 text-green-800';
    if (awardName.toLowerCase().includes('attendance')) return 'bg-purple-100 text-purple-800';
    if (awardName.toLowerCase().includes('top')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get badge icon based on award name
  const getBadgeIcon = (awardName) => {
    if (awardName.toLowerCase().includes('javascript') || awardName.toLowerCase().includes('react') || awardName.toLowerCase().includes('node')) {
      return <Award className="h-5 w-5" />;
    }
    if (awardName.toLowerCase().includes('attendance')) {
      return <CheckCircle2 className="h-5 w-5" />;
    }
    if (awardName.toLowerCase().includes('top')) {
      return <Medal className="h-5 w-5" />;
    }
    return <Trophy className="h-5 w-5" />;
  };

  // Format date string to readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get awards user hasn't earned yet
  const getUnearnedAwards = () => {
    if (!userAwards || !allAwards) return [];
    
    const earnedAwardIds = userAwards.map(ua => ua.awardId);
    return allAwards.filter(award => !earnedAwardIds.includes(award.id));
  };

  // Group awards by type
  const getAwardsByType = () => {
    if (!userAwards) return {};
    
    const groupedAwards = {};
    
    userAwards.forEach(userAward => {
      const type = userAward.award.name.split(' ')[0];
      if (!groupedAwards[type]) {
        groupedAwards[type] = [];
      }
      groupedAwards[type].push(userAward);
    });
    
    return groupedAwards;
  };

  const isLoading = isLoadingUserAwards || isLoadingAllAwards;
  const earnedAwards = userAwards || [];
  const unearnedAwards = getUnearnedAwards();
  const awardsByType = getAwardsByType();

  return (
    <UserLayout title="My Awards">
      {/* Awards Overview */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Trophy className="h-6 w-6 text-amber-500 mr-2" /> 
            Awards & Achievements
          </CardTitle>
          <CardDescription>
            Showcase of your accomplishments and badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : earnedAwards.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No awards yet</h3>
              <p className="text-gray-500">Complete assignments and courses to earn awards.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
              {earnedAwards.map((userAward) => (
                <div 
                  key={userAward.id} 
                  className="flex flex-col items-center text-center p-4 border rounded-lg w-32"
                  title={userAward.award.description}
                >
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-amber-100 mb-2">
                    <span className="text-2xl font-bold text-amber-600">{userAward.award.badge}</span>
                  </div>
                  <p className="text-sm font-medium truncate w-full" title={userAward.award.name}>
                    {userAward.award.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(userAward.awardedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{earnedAwards.length}</span> awards earned out of <span className="font-medium">{(allAwards?.length || 0)}</span> total
          </div>
        </CardFooter>
      </Card>
      
      {/* Awards by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Earned Awards by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <div className="flex items-center">
                <Medal className="h-5 w-5 text-amber-500 mr-2" />
                Awards by Category
              </div>
            </CardTitle>
            <CardDescription>Your achievements grouped by type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : Object.keys(awardsByType).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No awards earned yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(awardsByType).map(([type, awards]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="text-md font-medium">{type} Awards</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {awards.map((userAward) => (
                        <div 
                          key={userAward.id} 
                          className="flex items-center p-3 border rounded-lg"
                        >
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-amber-600">{userAward.award.badge}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{userAward.award.name}</p>
                            <p className="text-xs text-gray-500">{userAward.award.description}</p>
                          </div>
                          <Badge variant="outline" className={getBadgeBackground(userAward.award.name)}>
                            {formatDate(userAward.awardedAt)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Available Awards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 text-amber-500 mr-2" />
                Available Awards
              </div>
            </CardTitle>
            <CardDescription>Awards you can still earn</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : unearnedAwards.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Congratulations!</h3>
                <p className="text-gray-500">You've earned all available awards.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {unearnedAwards.map((award) => (
                  <div 
                    key={award.id} 
                    className="flex items-center p-3 border border-dashed rounded-lg"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-gray-400">{award.badge}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{award.name}</p>
                      <p className="text-xs text-gray-500">{award.description}</p>
                    </div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-500">
                      <div className="flex items-center">
                        {getBadgeIcon(award.name)}
                        <span className="ml-1">Locked</span>
                      </div>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
