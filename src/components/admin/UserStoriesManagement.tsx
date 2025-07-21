import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Search, FileText, User, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface UserStory {
  id: string;
  title: string;
  content: string;
  author_id: string;
  business_vertical: string | null;
  geolocation: string | null;
  created_at: string;
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
}

export function UserStoriesManagement() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUserStories();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterStories();
  }, [stories, searchTerm]);

  const fetchUserStories = async () => {
    try {
      setLoading(true);
      
      // Fetch all stories with author profiles and tags
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      if (!storiesData) {
        setStories([]);
        return;
      }

      // Transform stories with profiles and tags
      const storiesWithRelations = await Promise.all(
        storiesData.map(async (story) => {
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, email, department')
            .eq('user_id', story.author_id)
            .maybeSingle();

          // Fetch story tags
          const { data: storyTags } = await supabase
            .from('story_tags')
            .select('tags(id, name, color)')
            .eq('story_id', story.id);

          return {
            ...story,
            profiles: profileData,
            story_tags: storyTags || []
          };
        })
      );

      setStories(storiesWithRelations);
    } catch (error: any) {
      console.error('Error fetching user stories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user stories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStories = () => {
    let filtered = [...stories];

    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStories(filtered);
  };

  const handleDeleteStory = async (storyId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the story "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(storyId);

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Story deleted successfully',
      });

      // Refresh stories
      fetchUserStories();
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only administrators can access user story management features.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            User Stories Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            View and manage all stories posted by users across the platform
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search stories, users, content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredStories.length} of {stories.length} stories
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading stories...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStories.map((story) => (
            <Card key={story.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{story.title}</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStory(story.id, story.title)}
                        disabled={deleting === story.id}
                      >
                        {deleting === story.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-background" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {story.profiles?.display_name || 'Unknown User'} 
                          {story.profiles?.email && (
                            <span className="ml-1">({story.profiles.email})</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(story.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    {story.profiles?.department && (
                      <div className="text-sm text-muted-foreground">
                        Department: {story.profiles.department}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {story.content.substring(0, 200)}
                      {story.content.length > 200 && '...'}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {story.business_vertical && (
                        <Badge variant="outline">
                          {story.business_vertical}
                        </Badge>
                      )}
                      {story.geolocation && (
                        <Badge variant="outline">
                          {story.geolocation}
                        </Badge>
                      )}
                      {story.story_tags.map((st) => (
                        <Badge
                          key={st.tags.id}
                          variant="secondary"
                          style={{ backgroundColor: `${st.tags.color}20`, borderColor: st.tags.color }}
                        >
                          {st.tags.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredStories.length === 0 && !loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? 'No matching stories found' : 'No stories yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Try adjusting your search criteria'
                      : 'Stories will appear here as users create them'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}