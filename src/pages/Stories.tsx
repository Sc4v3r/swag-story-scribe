import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StoryCard } from '@/components/stories/StoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Story {
  id: string;
  title: string;
  content: string;
  author_id: string;
  business_vertical: string | null;
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

interface Tag {
  id: string;
  name: string;
  color: string;
}

const Stories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  useEffect(() => {
    console.log('Stories component mounted');
    fetchStories();
    fetchTags();
  }, []);

  useEffect(() => {
    filterAndSortStories();
  }, [stories, searchTerm, selectedTag, selectedVertical, sortBy]);

  const fetchStories = async () => {
    try {
      console.log('Fetching stories...');
      setLoading(true);
      setError(null);

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Stories data:', storiesData);
      console.log('Stories error:', storiesError);

      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
        setError(storiesError.message);
        return;
      }

      if (!storiesData || storiesData.length === 0) {
        console.log('No stories found in database');
        setStories([]);
        setLoading(false);
        return;
      }

      // Transform stories with profiles and tags
      const storiesWithRelations = await Promise.all(
        storiesData.map(async (story) => {
          console.log('Processing story:', story.id);
          
          // Try to fetch profile (may fail for unauthenticated users)
          let profile = null;
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('display_name, email, department')
              .eq('user_id', story.author_id)
              .maybeSingle();
            
            if (profileError) {
              console.log('Profile fetch error for story', story.id, ':', profileError);
            } else {
              profile = profileData;
            }
          } catch (error) {
            console.log('Profile fetch failed for story author:', error);
          }

          // Fetch story tags
          const { data: storyTags, error: tagsError } = await supabase
            .from('story_tags')
            .select('tags(id, name, color)')
            .eq('story_id', story.id);

          if (tagsError) {
            console.log('Tags fetch error for story', story.id, ':', tagsError);
          }

          return {
            ...story,
            profiles: profile,
            story_tags: storyTags || []
          };
        })
      );

      console.log('Final stories with relations:', storiesWithRelations);
      setStories(storiesWithRelations);
    } catch (error: any) {
      console.error('Unexpected error in fetchStories:', error);
      setError(error.message || 'Failed to load stories');
      toast({
        title: 'Error',
        description: 'Failed to load stories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const filterAndSortStories = () => {
    let filtered = [...stories];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tag
    if (selectedTag && selectedTag !== 'all') {
      filtered = filtered.filter(story =>
        story.story_tags.some(st => st.tags.id === selectedTag)
      );
    }

    // Filter by business vertical
    if (selectedVertical && selectedVertical !== 'all') {
      filtered = filtered.filter(story =>
        story.business_vertical === selectedVertical
      );
    }

    // Sort stories
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredStories(filtered);
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
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
      fetchStories();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        variant: 'destructive',
      });
    }
  };

  const getUniqueVerticals = () => {
    const verticals = stories
      .map(story => story.business_vertical)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return verticals as string[];
  };

  console.log('Render state - loading:', loading, 'error:', error, 'stories count:', stories.length);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading stories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Stories</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchStories}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Stories</h1>
          <p className="text-muted-foreground mt-1">
            Discover and explore stories from across your organization
          </p>
        </div>
        {user ? (
          <Button asChild>
            <Link to="/write">
              <Plus className="mr-2 h-4 w-4" />
              Write Story
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth">
              <Plus className="mr-2 h-4 w-4" />
              Sign In to Write
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search stories, authors, content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedVertical} onValueChange={setSelectedVertical}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by vertical" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All verticals</SelectItem>
              {getUniqueVerticals().map((vertical) => (
                <SelectItem key={vertical} value={vertical}>
                  {vertical}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'title') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedTag && selectedTag !== 'all' || selectedVertical && selectedVertical !== 'all' || searchTerm) && (
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchTerm}"
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedTag && selectedTag !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Tag: {tags.find(t => t.id === selectedTag)?.name}
              <button 
                onClick={() => setSelectedTag('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          {selectedVertical && selectedVertical !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Vertical: {selectedVertical}
              <button 
                onClick={() => setSelectedVertical('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full"
              >
                ×
              </button>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchTerm('');
              setSelectedTag('all');
              setSelectedVertical('all');
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredStories.length} of {stories.length} stories
      </div>

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onDelete={handleDeleteStory}
              onEdit={() => {/* Will implement edit functionality */}}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {stories.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
                <p>Be the first to share a story!</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No stories match your filters</h3>
                <p>Try adjusting your search criteria</p>
              </>
            )}
          </div>
          {stories.length === 0 && user && (
            <Button asChild>
              <Link to="/write">
                <Plus className="mr-2 h-4 w-4" />
                Write First Story
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Stories;
