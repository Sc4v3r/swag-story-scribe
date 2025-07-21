import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoryCard } from '@/components/stories/StoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Users, TrendingUp } from 'lucide-react';

interface Story {
  id: string;
  title: string;
  content: string;
  author_id: string;
  business_vertical_id: string | null;
  geolocation: string | null;
  diagram_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    department: string | null;
  } | null;
  story_tags: Array<{
    tags: {
      id: string;
      name: string;
      color: string;
    };
  }>;
  business_verticals?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [stats, setStats] = useState({
    totalStories: 0,
    userStories: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent stories (last 5) - simplified for now
      const { data: recent, error: recentError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      
      // Transform the data to match our interface
      const recentWithProfiles = await Promise.all(
        (recent || []).map(async (story) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, department')
            .eq('user_id', story.author_id)
            .single();

          const { data: storyTags } = await supabase
            .from('story_tags')
            .select('tags(id, name, color)')
            .eq('story_id', story.id);

          return {
            ...story,
            profiles: profile,
            story_tags: storyTags || []
          };
        })
      );
      
      setRecentStories(recentWithProfiles);

      // Fetch user's stories (last 3)
      const { data: userStoriesData, error: userError } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (userError) throw userError;
      
      // Transform user stories
      const userStoriesWithProfiles = await Promise.all(
        (userStoriesData || []).map(async (story) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, department')
            .eq('user_id', story.author_id)
            .single();

          const { data: storyTags } = await supabase
            .from('story_tags')
            .select('tags(id, name, color)')
            .eq('story_id', story.id);

          return {
            ...story,
            profiles: profile,
            story_tags: storyTags || []
          };
        })
      );
      
      setUserStories(userStoriesWithProfiles);

      // Fetch stats
      const [
        { count: totalStories },
        { count: userStoriesCount },
        { count: totalUsers }
      ] = await Promise.all([
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }).eq('author_id', user!.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalStories: totalStories || 0,
        userStories: userStoriesCount || 0,
        totalUsers: totalUsers || 0,
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.display_name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your stories today.
          </p>
        </div>
        <Button asChild>
          <Link to="/write">
            <Plus className="mr-2 h-4 w-4" />
            Write Story
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStories}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userStories}</div>
            <p className="text-xs text-muted-foreground">
              Stories you've written
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active storytellers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Stories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Stories</h2>
          <Button variant="outline" asChild>
            <Link to="/stories">View All</Link>
          </Button>
        </div>

        {recentStories.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Be the first to share a story in your organization!
              </p>
              <Button asChild>
                <Link to="/write">
                  <Plus className="mr-2 h-4 w-4" />
                  Write First Story
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User's Stories */}
      {userStories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Recent Stories</h2>
            <Button variant="outline" asChild>
              <Link to="/stories?author=me">View All Yours</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story}
                onEdit={() => {/* Will implement edit functionality */}}
                onDelete={() => {/* Will implement delete functionality */}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;