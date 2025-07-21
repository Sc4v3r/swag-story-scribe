import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StoryCard } from '@/components/stories/StoryCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Plus, PenTool, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

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

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface BusinessVertical {
  id: string;
  name: string;
  description?: string;
}

const Landing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [selectedGeolocation, setSelectedGeolocation] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  useEffect(() => {
    fetchStories();
    fetchTags();
    fetchBusinessVerticals();
  }, []);

  useEffect(() => {
    filterAndSortStories();
  }, [stories, searchTerm, selectedTag, selectedVertical, selectedGeolocation, sortBy]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*, business_verticals(id, name, description)')
        .order('created_at', { ascending: false });

      if (storiesError) {
        console.error('Error fetching stories:', storiesError);
        setError(storiesError.message);
        return;
      }

      if (!storiesData || storiesData.length === 0) {
        setStories([]);
        setLoading(false);
        return;
      }

      // Transform stories with profiles and tags
      const storiesWithRelations = await Promise.all(
        storiesData.map(async (story) => {
          // Try to fetch profile (may fail for unauthenticated users, that's ok)
          let profile = null;
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('display_name, email, department')
              .eq('user_id', story.author_id)
              .maybeSingle();
            profile = profileData;
          } catch (error) {
            // Continue without profile data for unauthenticated users
          }

          // Fetch story tags
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

  const fetchBusinessVerticals = async () => {
    try {
      const { data, error } = await supabase
        .from('business_verticals')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching business verticals:', error);
        return;
      }
      
      setBusinessVerticals(data || []);
    } catch (error) {
      console.error('Error fetching business verticals:', error);
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
        story.business_vertical_id === selectedVertical
      );
    }

    // Filter by geolocation
    if (selectedGeolocation && selectedGeolocation !== 'all') {
      filtered = filtered.filter(story =>
        story.geolocation === selectedGeolocation
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

  // Remove the old getPredefinedVerticals function since we now fetch from database

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading stories...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2 text-destructive">Error Loading Stories</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchStories}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header with Sign In Button - only show for unauthenticated users */}
      {!user && (
        <div className="absolute top-0 right-0 p-4 z-10">
          <Button variant="outline" asChild>
            <Link to="/auth">
              Sign In
            </Link>
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <div className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Pentest Stories
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover real-world penetration testing stories, techniques, and insights from security professionals across various industries.
            </p>
            
            {user && (
              <Button size="lg" asChild>
                <Link to="/write">
                  <Plus className="mr-2 h-5 w-5" />
                  Share Your Story
                </Link>
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stories.length}</div>
              <div className="text-sm text-muted-foreground">Stories Shared</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{new Set(stories.map(s => s.author_id)).size}</div>
              <div className="text-sm text-muted-foreground">Contributors</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border">
              <Filter className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{new Set(stories.map(s => s.business_vertical_id).filter(Boolean)).size}</div>
              <div className="text-sm text-muted-foreground">Industries</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Section */}
      <div className="container mx-auto px-4 py-8 space-y-6">
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
                {businessVerticals.map((vertical) => (
                  <SelectItem key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGeolocation} onValueChange={setSelectedGeolocation}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                <SelectItem value="AMER">AMER</SelectItem>
                <SelectItem value="EMEA">EMEA</SelectItem>
                <SelectItem value="APAC">APAC</SelectItem>
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
        {(selectedTag && selectedTag !== 'all' || selectedVertical && selectedVertical !== 'all' || selectedGeolocation && selectedGeolocation !== 'all' || searchTerm) && (
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
                Vertical: {businessVerticals.find(v => v.id === selectedVertical)?.name}
                <button 
                  onClick={() => setSelectedVertical('all')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedGeolocation && selectedGeolocation !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Region: {selectedGeolocation}
                <button 
                  onClick={() => setSelectedGeolocation('all')}
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
                setSelectedGeolocation('all');
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
                showActions={user ? true : false}
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
            {stories.length === 0 && (
              <Button asChild>
                <Link to={user ? "/write" : "/auth"}>
                  <Plus className="mr-2 h-4 w-4" />
                  {user ? "Write First Story" : "Sign In to Write Stories"}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // If user is authenticated, wrap content in AppLayout (which includes sidebar)
  // If user is not authenticated, show content directly
  return user ? (
    <AppLayout>{renderContent()}</AppLayout>
  ) : (
    renderContent()
  );
};

export default Landing;