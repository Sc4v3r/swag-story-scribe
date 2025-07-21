import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Calendar, Building } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Story {
  id: string;
  title: string;
  content: string;
  author_id: string;
  business_vertical: string | null;
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
}

const StoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (storyError) {
        if (storyError.code === 'PGRST116') {
          setError('Story not found');
        } else {
          setError(storyError.message);
        }
        return;
      }

      // Try to fetch profile (may fail for unauthenticated users)
      let profile = null;
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name, email, department')
          .eq('user_id', storyData.author_id)
          .maybeSingle();
        
        profile = profileData;
      } catch (error) {
        console.log('Profile fetch failed, continuing without profile data');
      }

      // Fetch story tags
      const { data: storyTags } = await supabase
        .from('story_tags')
        .select('tags(id, name, color)')
        .eq('story_id', storyData.id);

      setStory({
        ...storyData,
        profiles: profile,
        story_tags: storyTags || []
      });
    } catch (error: any) {
      console.error('Error fetching story:', error);
      setError('Failed to load story');
      toast({
        title: 'Error',
        description: 'Failed to load story',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2 text-destructive">
            {error || 'Story not found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            The story you're looking for could not be found.
          </p>
          <Button asChild>
            <Link to="/stories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stories
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const authorName = story.profiles?.display_name || story.profiles?.email || 'Unknown Author';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/stories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Stories
          </Link>
        </Button>
      </div>

      {/* Story content */}
      <Card>
        <CardHeader className="pb-6">
          <div className="space-y-4">
            {/* Title */}
            <h1 className="text-3xl font-bold leading-tight">{story.title}</h1>
            
            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
                {story.profiles?.department && (
                  <>
                    <span>•</span>
                    <span>{story.profiles.department}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
              </div>

              {story.business_vertical && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <Badge variant="outline">
                    {story.business_vertical}
                  </Badge>
                </div>
              )}
            </div>

            {/* Tags */}
            {story.story_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {story.story_tags.map(({ tags }) => (
                  <Badge 
                    key={tags.id} 
                    variant="secondary"
                    style={{ backgroundColor: `${tags.color}20`, color: tags.color, borderColor: tags.color }}
                  >
                    {tags.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Kill Chain Diagram */}
          {story.diagram_url && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Kill Chain Diagram
              </h2>
              <div className="border rounded-lg overflow-hidden bg-gray-50 p-4">
                <img 
                  src={story.diagram_url} 
                  alt="Kill Chain Diagram" 
                  className="w-full h-auto max-w-4xl mx-auto rounded shadow-sm"
                />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Visual representation of the attack methodology and kill chain used in this penetration test
                </p>
              </div>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-foreground leading-relaxed">
              {story.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions for authenticated users */}
      {user && (user.id === story.author_id || user) && (
        <div className="mt-6 flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/write?edit=${story.id}`}>
              Edit Story
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default StoryDetail;